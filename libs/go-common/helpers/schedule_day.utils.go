package helpers

import (
	"strconv"
	"strings"
	"time"

	carbon "github.com/uniplaces/carbon"
)

var SpendingLimitFrequency = struct {
	Daily   string
	Weekly  string
	Monthly string
}{
	Daily:   "daily",
	Weekly:  "weekly",
	Monthly: "monthly",
}

type IScheduleTaskRecurrence struct {
	Frequency string
	RunDay    *string
	Timezone  *string
	HourTime  *string // 24 hour format time (e.g. 13:00)
}

type ScheduleTimeWindow struct {
	Start time.Time
	End   time.Time
}

func (s *ScheduleTimeWindow) String(layout ...string) string {
	if len(layout) > 0 {
		return s.Start.Format(layout[0]) + " - " + s.End.Format(layout[0])
	}

	return s.Start.Format("2006-01-02 15:04:05") + " - " + s.End.Format("2006-01-02 15:04:05")
}

func (s *ScheduleTimeWindow) Diff() time.Duration {
	return s.End.Sub(s.Start)
}

/**
 * Utility function to get the next renewal date for a spending limit
 * @param limit
 * @returns Date
 *
 * Using the renewal frequency and renewal day, this function returns the next renewal date
 *
 * renewal frequency can be daily, weekly or monthly
 * renewal day can be a numeric day of the week or a schedule day of the week
 *
 * numeric day of the week is a number between 1 and 7
 *
 * schedule day of the week is a string in the format 1w.1d
 * 1w.1d means monday of the first week of the month
 * 1w.5d means friday of the first week of the month
 * -1w.7d means sunday of the last week of the month
 * 1w.-1d means sunday of the first week of the month

 * 1d means first day of the week or first day of month
 * -1d means last day of the week or last day of month
 *
 *
 * 1 alias for 1d
 *
 */

type ScheduleDayUtils struct {
	today *carbon.Carbon
}

func NewScheduleDayUtils(t ...time.Time) *ScheduleDayUtils {
	if len(t) == 0 {
		return &ScheduleDayUtils{today: carbon.Now()}
	}
	return &ScheduleDayUtils{today: carbon.NewCarbon(t[0])}
}

func (s *ScheduleDayUtils) GetNextRunDate(limit IScheduleTaskRecurrence) *time.Time {
	// if the limit has a time zone, set the time zone
	if limit.Timezone != nil {
		// localize the date to the timezone
		zonedTime := UtcToZonedTime(s.today.Time, *limit.Timezone)
		s.today = carbon.NewCarbon(*zonedTime)
	}

	// calculate the next run date
	nextRunDate := s.calculateNextRunDate(limit)
	if nextRunDate == nil {
		return nil
	}

	// set the hour time on the next run date
	nextRunDate = Ptr(s.setHourTimeOnCarbon(*nextRunDate, limit))

	if limit.Timezone != nil {
		nextRunDateUTC := ZonedTimeToUtc(nextRunDate.Time, *limit.Timezone)
		nextRunDate = carbon.NewCarbon(*nextRunDateUTC)
	}
	return Ptr(nextRunDate.Time)
}

// GetCurrentPeriodStart returns the start of the current renewal period —
// i.e. the most recent renewal boundary before now.
// It works by computing the next run date and subtracting one frequency interval.
// For daily limits, the period started at midnight today.
func (s *ScheduleDayUtils) GetCurrentPeriodStart(limit IScheduleTaskRecurrence) *time.Time {
	nextRun := s.GetNextRunDate(limit)
	if nextRun == nil {
		return nil
	}

	var periodStart time.Time
	switch limit.Frequency {
	case SpendingLimitFrequency.Daily:
		periodStart = nextRun.AddDate(0, 0, -1)
	case SpendingLimitFrequency.Weekly:
		periodStart = nextRun.AddDate(0, 0, -7)
	case SpendingLimitFrequency.Monthly:
		periodStart = nextRun.AddDate(0, -1, 0)
	default:
		return nil
	}

	// Zero out sub-day precision — period boundaries are midnight
	periodStart = time.Date(periodStart.Year(), periodStart.Month(), periodStart.Day(), 0, 0, 0, 0, periodStart.Location())
	return &periodStart
}

func (s *ScheduleDayUtils) calculateNextRunDate(limit IScheduleTaskRecurrence) *carbon.Carbon {
	if limit.Frequency == SpendingLimitFrequency.Daily {
		return s.today.AddDays(1)
	}

	if limit.RunDay != nil && IsNumberString(*limit.RunDay) {
		return s.nextRunByNumericDay(limit)
	}

	return s.nextRunByScheduleDay(limit)
}

func (s *ScheduleDayUtils) nextRunByNumericDay(limit IScheduleTaskRecurrence, renewalDay ...int) *carbon.Carbon {
	var absRenewalDay int
	if len(renewalDay) > 0 {
		absRenewalDay = renewalDay[0]
	} else {
		absRenewalDay = s.getAbsDay(limit.Frequency, *limit.RunDay)
	}

	renewalFrequency := limit.Frequency

	if renewalFrequency == SpendingLimitFrequency.Weekly {
		if absRenewalDay > s.getAbsTodayWeekDay() {
			thisWeek := s.today.StartOfWeek()
			dayThisWeek := thisWeek.AddDays(absRenewalDay - 1)
			thisWeek.SetDay(absRenewalDay)
			return dayThisWeek
		}

		thisWeek := s.today.StartOfWeek()
		nextWeek := thisWeek.AddWeeks(1)
		dayNextWeek := nextWeek.AddDays(absRenewalDay - 1)
		return dayNextWeek
	}

	if renewalFrequency == SpendingLimitFrequency.Monthly {
		if absRenewalDay > s.today.Day() {
			thisMonth := s.today.StartOfMonth()
			thisMonth.SetDay(absRenewalDay)
			return thisMonth
		}

		nextMonth := s.today.AddMonths(1).StartOfMonth()
		nextMonth.SetDay(absRenewalDay)
		return nextMonth
	}

	return nil
}

func (s *ScheduleDayUtils) nextRunByScheduleDayAndWeek(limit IScheduleTaskRecurrence, renewalWeek, renewalDay int) *carbon.Carbon {
	thisWeek := s.today.WeekOfMonth()
	renewalFrequency := limit.Frequency

	if renewalFrequency == SpendingLimitFrequency.Monthly {
		// if renewal week is greater than today, then next renewal date is this month
		if renewalWeek >= thisWeek && renewalDay > s.today.Day() {
			fistDayOfMonth := s.today.StartOfMonth()
			lastDayOfMonth := s.today.EndOfMonth()
			theWeek := fistDayOfMonth.AddWeeks(renewalWeek - 1).StartOfWeek()
			dayOfWeek := theWeek.AddDays(renewalDay - 1)
			if dayOfWeek.Before(fistDayOfMonth.Time) {
				theWeek = fistDayOfMonth.AddWeeks(renewalWeek).StartOfWeek()
				return theWeek.AddDays(renewalDay - 1)
			}
			if dayOfWeek.After(lastDayOfMonth.Time) {
				theWeek = fistDayOfMonth.AddWeeks(renewalWeek - 2).StartOfWeek()
				return theWeek.AddDays(renewalDay - 1)
			}
			return dayOfWeek
		}

		fistDayOfNextMonth := s.today.AddMonths(1).StartOfMonth()
		lastDayOfNextMonth := s.today.AddMonths(1).EndOfMonth()
		theWeek := fistDayOfNextMonth.AddWeeks(renewalWeek - 1).StartOfWeek()
		dayOfWeek := theWeek.AddDays(renewalDay - 1)

		if dayOfWeek.Before(fistDayOfNextMonth.Time) {
			theWeek = fistDayOfNextMonth.AddWeeks(renewalWeek)
			return theWeek.AddDays(renewalDay - 1)
		}
		if dayOfWeek.After(lastDayOfNextMonth.Time) {
			theWeek = fistDayOfNextMonth.AddWeeks(renewalWeek - 2)
			return theWeek.AddDays(renewalDay - 1)
		}

		return dayOfWeek
	}

	return nil
}

func (s *ScheduleDayUtils) nextRunByScheduleDay(limit IScheduleTaskRecurrence) *carbon.Carbon {
	var renewalDay string

	if limit.RunDay != nil {
		renewalDay = *limit.RunDay
	} else {
		renewalDay = s.getDefaultScheduleDay(limit.Frequency) // default to the current schedule day
	}

	splitDay := strings.Split(renewalDay, ".")

	if len(splitDay) == 1 {
		renewalDay := strings.Replace(splitDay[0], "d", "", -1)
		return s.nextRunByNumericDay(limit, s.getAbsDay(limit.Frequency, renewalDay))
	}

	if len(splitDay) == 2 {
		renewalWeek := strings.Replace(splitDay[0], "w", "", -1)
		renewalDay := strings.Replace(splitDay[1], "d", "", -1)
		return s.nextRunByScheduleDayAndWeek(limit, s.getAbsWeek(renewalWeek), s.getAbsWeekDay(renewalDay))
	}

	return nil
}

func (s *ScheduleDayUtils) getAbsWeek(week string) int {
	weeksInThisMonth := GetWeeksInMonth(s.today)
	weekNumeric, _ := strconv.Atoi(week)
	if weekNumeric < 0 {
		return (weeksInThisMonth + 1) + weekNumeric
	}
	if weekNumeric > weeksInThisMonth {
		return weeksInThisMonth
	}
	return weekNumeric
}

func (s *ScheduleDayUtils) getAbsWeekDay(day string) int {
	dayNumeric, _ := strconv.Atoi(day)
	if dayNumeric < 0 {
		return 8 + dayNumeric
	}

	return dayNumeric
}

func (s *ScheduleDayUtils) getAbsTodayWeekDay() int {
	day := int(s.today.Weekday())
	if day == 0 {
		return 7
	}
	return day
}

// getDefaultScheduleDay returns the default schedule day for a given frequency
// the current day of the month for monthly frequency and the current day of the week for weekly frequency
func (s *ScheduleDayUtils) getDefaultScheduleDay(frequency string) string {

	if frequency == SpendingLimitFrequency.Weekly {
		day := s.getAbsTodayWeekDay()
		return strconv.Itoa(day) + "d"
	}

	day := s.today.Day()
	return strconv.Itoa(day) + "d"
}

func (s *ScheduleDayUtils) getAbsMonthDay(day string) int {
	daysInThisMonth := s.today.DaysInMonth()
	dayNumeric, _ := strconv.Atoi(day)
	if dayNumeric < 0 {
		return (daysInThisMonth + 1) + dayNumeric
	}
	if dayNumeric > daysInThisMonth {
		return daysInThisMonth
	}
	return dayNumeric

}

func (s *ScheduleDayUtils) getAbsDay(frequency string, runDay string) int {
	if frequency == SpendingLimitFrequency.Weekly {
		return s.getAbsWeekDay(runDay)
	}

	return s.getAbsMonthDay(runDay)
}

func (s *ScheduleDayUtils) setHourTimeOnCarbon(t carbon.Carbon, limit IScheduleTaskRecurrence) carbon.Carbon {
	var hour, min int
	if limit.HourTime != nil {
		hour, min = getHourAndMinute(*limit.HourTime)
	} else {
		hour = s.today.Hour()
		min = s.today.Minute()
	}
	t.SetHour(hour)
	t.SetMinute(min)
	return t
}

func GetWeeksInMonth(c *carbon.Carbon) int {
	fullWeeks := c.DaysInMonth() / 7
	remainingDays := c.DaysInMonth() % 7
	if remainingDays > 0 {
		return fullWeeks + 1
	}
	return fullWeeks
}

// getCurrentTimeWindow returns the start and end time of the current 30 mins time window
func GetCurrentThirtyMinutesTimeWindow(now time.Time) ScheduleTimeWindow {
	today := carbon.NewCarbon(now)
	thirtyStart := today

	if thirtyStart.Minute() < 30 {
		thirtyStart.SetMinute(0)
	} else {
		thirtyStart.SetMinute(30)
	}

	thirtyEnd := thirtyStart.AddMinutes(29)

	return ScheduleTimeWindow{
		Start: thirtyStart.Time,
		End:   thirtyEnd.Time,
	}
}

// getCurrentMonthTimeWindow returns the start and end time of the current month time window
func GetCurrentMonthTimeWindow(now time.Time, upUntilNow ...bool) ScheduleTimeWindow {
	today := carbon.NewCarbon(now)
	monthStart := today.StartOfMonth()
	monthEnd := today.EndOfMonth()

	if len(upUntilNow) > 0 && upUntilNow[0] {
		monthEnd = today
	}

	return ScheduleTimeWindow{
		Start: monthStart.Time,
		End:   monthEnd.Time,
	}
}

// getNextWeekTimeWindow returns the start and end time of the next week time window
func GetNextWeekTimeWindow(now time.Time) ScheduleTimeWindow {
	today := carbon.NewCarbon(now)
	nextWeek := today.AddWeek()
	nextWeekStart := nextWeek.StartOfWeek()
	nextWeekEnd := nextWeek.EndOfWeek()

	return ScheduleTimeWindow{
		Start: nextWeekStart.Time,
		End:   nextWeekEnd.Time,
	}
}

// getNextDayTimeWindow returns the start and end time of the next day time window
func GetNextDayTimeWindow(now time.Time) ScheduleTimeWindow {
	today := carbon.NewCarbon(now)
	tomorrow := today.AddDay()
	tomorrowStart := tomorrow.StartOfDay()
	tomorrowEnd := tomorrow.EndOfDay()

	return ScheduleTimeWindow{
		Start: tomorrowStart.Time,
		End:   tomorrowEnd.Time,
	}
}

// getPrevDayTimeWindow returns the start and end time of the prev day time window
func GetPrevDayTimeWindow(now time.Time) ScheduleTimeWindow {
	today := carbon.NewCarbon(now)
	yesterday := today.SubDay()
	yesterdayStart := yesterday.StartOfDay()
	yesterdayEnd := yesterday.EndOfDay()

	return ScheduleTimeWindow{
		Start: yesterdayStart.Time,
		End:   yesterdayEnd.Time,
	}
}

// getNextThirtyMinutesTimeWindow returns the start and end time of the next 30 minutes time window
func GetNextThirtyMinutesTimeWindow(now time.Time) ScheduleTimeWindow {
	today := carbon.NewCarbon(now)
	nextThirty := today.AddMinutes(30)
	nextThirtyStart := nextThirty

	if nextThirty.Minute() < 30 {
		nextThirtyStart.SetMinute(0)
	} else {
		nextThirtyStart.SetMinute(30)
	}

	nextThirtyEnd := nextThirtyStart.AddMinutes(29)

	return ScheduleTimeWindow{
		Start: nextThirtyStart.Time,
		End:   nextThirtyEnd.Time,
	}
}

// checkIfWithinCurrentTimeWindow checks if a given time falls within a specified time window.
// It returns true if the time is greater than or equal to the start time and less than the end time.
func CheckIfWithinTimeWindow(t time.Time, window ScheduleTimeWindow) bool {
	return t.Compare(window.Start) >= 0 && t.Compare(window.End) < 0
}

func getHourAndMinute(hourTime string) (int, int) {
	split := strings.Split(hourTime, ":")
	hour, _ := strconv.Atoi(split[0])
	min, _ := strconv.Atoi(split[1])
	return hour, min
}

func IsTimeToday(t time.Time, _now ...time.Time) bool {
	now := IsTimeNow(_now...)
	return t.Year() == now.Year() && t.YearDay() == now.YearDay()
}

func IsTimeYesterday(t time.Time, _now ...time.Time) bool {
	now := IsTimeNow(_now...)
	yesterday := now.AddDate(0, 0, -1)
	return t.Year() == yesterday.Year() && t.YearDay() == yesterday.YearDay()
}

func IsTimeTomorrow(t time.Time, _now ...time.Time) bool {
	now := IsTimeNow(_now...)
	tomorrow := now.AddDate(0, 0, 1)
	return t.Year() == tomorrow.Year() && t.YearDay() == tomorrow.YearDay()
}

func IsTimeThisWeek(t time.Time, _now ...time.Time) bool {
	now := IsTimeNow(_now...)
	_, thisWeek := now.ISOWeek()
	_, week := t.ISOWeek()
	return thisWeek == week
}

func IsTimeLastWeek(t time.Time, _now ...time.Time) bool {
	now := IsTimeNow(_now...)
	_, thisWeek := now.ISOWeek()
	_, week := t.ISOWeek()
	return thisWeek-1 == week
}

func IsTimeNextWeek(t time.Time, _now ...time.Time) bool {
	now := IsTimeNow(_now...)
	_, thisWeek := now.ISOWeek()
	_, week := t.ISOWeek()
	return thisWeek+1 == week
}

func IsTimeNow(_now ...time.Time) time.Time {
	now := time.Now()
	if len(_now) > 0 {
		now = _now[0]
	}
	return now
}
