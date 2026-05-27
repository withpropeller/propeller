import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { load, dump } from 'js-yaml';

interface GlobalConfig {
  registry: string;
  repo: string;
}

interface ComponentSpec {
  dockerfile?: string;
  context?: string;
  cast?: string;
  namespace?: string;
  build_args?: Record<string, string>;
  paths?: string[];
}

interface DeployConfig {
  global: GlobalConfig;
  environments: Record<string, string>;
  components: Record<string, ComponentSpec>;
}

function formatBuildArgs(args: Record<string, string>): string {
  return Object.entries(args)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

function componentBuildArgs(
  compBlock: unknown
): Record<string, string> | undefined {
  if (!compBlock || typeof compBlock !== 'object') return undefined;
  const block = compBlock as Record<string, unknown>;
  const inner = block.component;
  const source =
    inner && typeof inner === 'object'
      ? (inner as Record<string, unknown>)
      : block;
  const buildArgs = source.buildArgs;
  if (!buildArgs || typeof buildArgs !== 'object') return undefined;
  return buildArgs as Record<string, string>;
}

async function run(): Promise<void> {
  try {
    const component = core.getInput('component', { required: true });
    const environment = core.getInput('environment', { required: true });
    const configFile = core.getInput('config_file') || '.github/deploy-config.yml';
    const sha = core.getInput('sha') || process.env.GITHUB_SHA || '';
    const ref = core.getInput('ref') || process.env.GITHUB_REF_NAME || '';

    core.info(`Preparing ${component} → ${environment}`);

    const deployConfig = load(
      fs.readFileSync(path.resolve(configFile), 'utf-8')
    ) as DeployConfig;
    const globalCfg = deployConfig.global;
    const compSpec = deployConfig.components[component];

    if (!compSpec) {
      core.setFailed(`Unknown component '${component}' in ${configFile}`);
      return;
    }

    const registry = `${globalCfg.registry}/${globalCfg.repo}`;
    const imageName = `${registry}/${component}`;
    const shortSha = sha ? sha.slice(0, 7) : '';
    const safeRef = ref
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, '-')
      .replace(/^[.-]+/, '');
    const imageTag = shortSha
      ? safeRef
        ? `${safeRef}-${shortSha}`
        : `${environment}-${shortSha}`
      : environment;

    const envValuesPath = `infra/runeset/values/${environment}.yaml`;
    let envValues: Record<string, unknown> | undefined;
    if (fs.existsSync(envValuesPath)) {
      envValues = load(fs.readFileSync(envValuesPath, 'utf-8')) as Record<
        string,
        unknown
      >;
    }

    // ── Build outputs ───────────────────────────────────────────────
    const hasBuild = !!compSpec.dockerfile;
    core.setOutput('has_build', hasBuild ? 'true' : 'false');
    if (hasBuild) {
      core.setOutput('dockerfile', compSpec.dockerfile);
      core.setOutput('context', compSpec.context || '.');
      const mergedBuildArgs: Record<string, string> = {
        ...compSpec.build_args,
        ...componentBuildArgs(envValues?.[component]),
      };
      core.setOutput('build_args', formatBuildArgs(mergedBuildArgs));
      core.setOutput('image_name', imageName);
      core.setOutput('image_tag', imageTag);
      core.info(`  build: ${imageName}:${imageTag}`);
    } else {
      core.info(`  build: skipped (no dockerfile in deploy-config)`);
    }

    // ── Cast outputs ────────────────────────────────────────────────
    const castFile = compSpec.cast;
    if (!castFile) {
      core.setOutput('has_cast', 'false');
      core.info(`  cast: skipped (no cast in deploy-config)`);
      return;
    }

    const namespace = compSpec.namespace || environment;
    if (!envValues) {
      core.setFailed(`Values file not found: ${envValuesPath}`);
      return;
    }

    // Lift the active component's subtree to top-level `component:`
    // values structure: { docs: { component: { name, host, ... } }, ... }
    const overlay: Record<string, unknown> = {
      app: { tag: imageTag },
      registry,
    };

    const compBlock = envValues[component];
    if (compBlock && typeof compBlock === 'object') {
      const inner = (compBlock as Record<string, unknown>).component;
      const source =
        inner && typeof inner === 'object'
          ? { ...(inner as Record<string, unknown>) }
          : { ...(compBlock as Record<string, unknown>) };
      delete source.buildArgs;
      overlay.component = source;
    } else {
      core.info(
        `  no '${component}:' block in ${envValuesPath} — overlay omits component.*`
      );
    }

    const overlayDir = process.env.RUNNER_TEMP || '/tmp';
    const overlayPath = path.join(overlayDir, `${component}-overlay.yaml`);
    fs.writeFileSync(overlayPath, dump(overlay), 'utf-8');

    core.info(`  cast: ${castFile} (namespace=${namespace})`);
    core.info(`  overlay: ${overlayPath}`);
    core.info(dump(overlay));

    core.setOutput('has_cast', 'true');
    core.setOutput('cast_file', castFile);
    core.setOutput('namespace', namespace);
    core.setOutput('overlay_file', overlayPath);
    core.setOutput('values_files', `${envValuesPath}\n${overlayPath}`);
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

run();
