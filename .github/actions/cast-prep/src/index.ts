import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { load } from 'js-yaml';

// ── Types ────────────────────────────────────────────────────────

interface GlobalConfig {
  registry: string;
  repo: string;
}

interface ComponentSpec {
  dockerfile: string;
  context: string;
  cast?: string;
  paths?: string[];
}

interface DeployConfig {
  global: GlobalConfig;
  environments: Record<string, string>;
  components: Record<string, ComponentSpec>;
}

interface ValuesFile {
  [key: string]: unknown;
  app?: { tag?: string };
  registry?: string;
}

// ── Helpers ──────────────────────────────────────────────────────

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flatten(v as Record<string, unknown>, key));
    } else {
      result[key] = String(v ?? '');
    }
  }
  return result;
}

// ── Main ─────────────────────────────────────────────────────────

async function run(): Promise<void> {
  try {
    const component = core.getInput('component', { required: true });
    const environment = core.getInput('environment', { required: true });
    const configFile = core.getInput('config_file') || '.github/deploy-config.yml';

    core.info(`🔧 Preparing cast for ${component} → ${environment}`);

    // 1. Load deploy-config.yml
    const configPath = path.resolve(configFile);
    const deployConfig = load(fs.readFileSync(configPath, 'utf-8')) as DeployConfig;
    const globalCfg = deployConfig.global;
    const compSpec = deployConfig.components[component];

    if (!compSpec) {
      core.setOutput('has_cast', 'false');
      core.info(`No component '${component}' in deploy-config — skipping cast`);
      return;
    }

    const castFile = compSpec.cast;
    if (!castFile) {
      core.setOutput('has_cast', 'false');
      core.info(`No cast configured for '${component}'`);
      return;
    }

    // 2. Load values file
    const valuesFile = `infra/runeset/values/${environment}.yaml`;
    const valuesPath = path.resolve(valuesFile);
    const values = fs.existsSync(valuesPath)
      ? (load(fs.readFileSync(valuesPath, 'utf-8')) as ValuesFile)
      : {};

    // 3. Flatten values
    const flat = flatten(values);

    // Fill registry
    if (!flat['registry']) {
      flat['registry'] = `${globalCfg.registry}/${globalCfg.repo}`;
    }

    // Fill app.tag from environment name
    if (!flat['app.tag']) {
      flat['app.tag'] = environment;
    }

    // 4. Promote active component's keys to "component." prefix
    //    Values are:  web: { component: { name: web, host: ..., scale: 1, ... } }
    //    Cast uses:  {{ values:component.name }} {{ values:component.host }} etc.
    const compValues = values[component];
    if (compValues && typeof compValues === 'object') {
      const inner = (compValues as Record<string, unknown>).component;
      const source = (inner && typeof inner === 'object') ? inner : compValues;
      if (typeof source === 'object') {
        for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
          flat[`component.${k}`] = String(v ?? '');
        }
      }
    }

    core.info(`  Resolved ${Object.keys(flat).filter(k => k.startsWith('component.')).length} component.* keys`);
    core.info(JSON.stringify(Object.fromEntries(
      Object.entries(flat).filter(([k]) => k.startsWith('component.'))
    )));

    // 5. Read cast template and substitute {{ values:key }}
    const castPath = path.resolve(castFile);
    let content = fs.readFileSync(castPath, 'utf-8');

    content = content.replace(/\{\{\s*values:([\w.]+)\s*\}\}/g, (_match, key) => {
      const k = key.trim();
      return flat[k] ?? `__UNSET:${k}__`;
    });

    // 6. Write processed cast
    const outPath = '/tmp/processed-cast.yaml';
    fs.writeFileSync(outPath, content, 'utf-8');

    core.info('Processed cast:');
    core.info(content);

    core.setOutput('cast_file', outPath);
    core.setOutput('has_cast', 'true');
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

run();
