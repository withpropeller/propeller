package helpers

import (
	"testing"
	"time"

	"github.com/uniplaces/carbon"
)

func TestGetNextRunDateDaily(t *testing.T) {
	mockDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC) // Mock date is January 1, 2024

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		Frequency: SpendingLimitFrequency.Daily,
	})

	// Add your assertions here
	expectedDate := time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC) // Expected date is January 2, 2023
	if *nextRenewalDate != expectedDate {
		t.Errorf("Expected %v, got %v", expectedDate, nextRenewalDate)
	}

}

func TestGetNextRunDateDailyAtTimezone(t *testing.T) {
	mockDate := time.Date(2024, 6, 24, 13, 0, 0, 0, time.UTC) // Mock date is January 1, 2024 16:00:00 Canada/Eastern

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		Frequency: SpendingLimitFrequency.Daily,
		Timezone:  Ptr("Canada/Eastern"),
		HourTime:  Ptr("08:00"),
	})
	nextRenewalDateUnix := nextRenewalDate.Unix()

	// Add your assertions here
	expectedDate := time.Date(2024, 6, 25, 12, 0, 0, 0, time.UTC) // Expected date is January 2, 2023, 8:00:00 Canada/Eastern
	expectedDateUnix := expectedDate.Unix()
	if nextRenewalDateUnix != expectedDateUnix {
		t.Errorf("Expected %v (%v), got %v  (%v)", expectedDateUnix, expectedDate, nextRenewalDateUnix, nextRenewalDate)
	}

}

func TestGetNextRunDateDailyAtCayman(t *testing.T) {
	mockDate := time.Date(2024, 6, 24, 21, 23, 0, 0, time.UTC) // Mock date is June 24, 2024 21:23:00 UTC

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		Frequency: SpendingLimitFrequency.Daily,
		Timezone:  Ptr("America/Cayman"),
		HourTime:  Ptr("08:00"),
	})

	// Add your assertions here
	expectedDate := time.Date(2024, 6, 25, 13, 0, 0, 0, time.UTC) // Expected date is June 25, 2024 08:00:00 America/Cayman
	if *nextRenewalDate != expectedDate {
		t.Errorf("Expected %v, got %v ", expectedDate, nextRenewalDate)
	}

}

func TestGetNextRunDateWeeklyAtCayman(t *testing.T) {
	mockDate := time.Date(2024, 6, 26, 0, 15, 0, 0, time.UTC) // Mock date is June 26, 2024 00:15:00 UTC

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		Frequency: SpendingLimitFrequency.Weekly,
		Timezone:  Ptr("America/Cayman"),
		HourTime:  Ptr("08:00"),
	})

	// Add your assertions here
	expectedDate := time.Date(2024, 7, 2, 13, 0, 0, 0, time.UTC) // Expected date is July 2, 2024 08:00:00 America/Cayman
	if *nextRenewalDate != expectedDate {
		t.Errorf("Expected %v, got %v ", expectedDate, nextRenewalDate)
	}

}

func TestGetNextRunDateWeeklyNoRunDay(t *testing.T) {
	mockDate := time.Date(2024, 2, 1, 0, 0, 0, 0, time.UTC) // Mock date is February 1, 2024

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		Frequency: SpendingLimitFrequency.Weekly,
	})

	// Add your assertions here
	expectedDate := time.Date(2024, 2, 8, 0, 0, 0, 0, time.UTC) // Expected date is February 7, 2024
	if *nextRenewalDate != expectedDate {
		t.Errorf("Expected %v, got %v", expectedDate, nextRenewalDate)
	}

}

func TestGetNextRunDateWeeklyOnMonday(t *testing.T) {
	mockDate := time.Date(2024, 4, 7, 0, 0, 0, 0, time.UTC) // Mock date is April 7, 2024

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		RunDay:    Ptr("1"),
		Frequency: SpendingLimitFrequency.Weekly,
	})

	// Add your assertions here
	expectedDate := time.Date(2024, 4, 8, 0, 0, 0, 0, time.UTC) // Expected date is April 8, 2024
	if *nextRenewalDate != expectedDate {
		t.Errorf("Expected %v, got %v", expectedDate, nextRenewalDate)
	}

}

func TestGetNextRunDateWeeklyOnMondayEvening(t *testing.T) {
	mockDate := time.Date(2024, 4, 7, 0, 0, 0, 0, time.UTC) // Mock date is April 7, 2024

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		RunDay:    Ptr("1"),
		Frequency: SpendingLimitFrequency.Weekly,
		HourTime:  Ptr("18:30"),
	})

	// Add your assertions here
	expectedDate := time.Date(2024, 4, 8, 18, 30, 0, 0, time.UTC) // Expected date is April 8, 2024
	if *nextRenewalDate != expectedDate {
		t.Errorf("Expected %v, got %v", expectedDate, nextRenewalDate)
	}

}

func TestGetNextRunDateWeeklyOnSundayEveningTimezone(t *testing.T) {
	mockDate := time.Date(2024, 6, 23, 0, 0, 0, 0, time.UTC) // Mock date is June 30, 2024

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		RunDay:    Ptr("7"),
		Timezone:  Ptr("Africa/Lagos"),
		Frequency: SpendingLimitFrequency.Weekly,
		HourTime:  Ptr("18:30"),
	})
	nextRenewalDateUnix := nextRenewalDate.Unix()

	// Add your assertions here
	expectedDate := time.Date(2024, 6, 30, 17, 30, 0, 0, time.UTC) // Expected date is June 30, 2024 18:30:00 WAT
	expectedDateUnix := expectedDate.Unix()
	if nextRenewalDateUnix != expectedDateUnix {
		t.Errorf("Expected %v (%v), got %v  (%v)", expectedDateUnix, expectedDate, nextRenewalDateUnix, nextRenewalDate)
	}

}

func TestGetNextRunDateWeeklyWithFirstRunDay(t *testing.T) {
	mockDate := time.Date(2024, 2, 7, 0, 0, 0, 0, time.UTC) // Mock date is February 7, 2024

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		Frequency: SpendingLimitFrequency.Weekly,
		RunDay:    Ptr("5"),
	})

	// Add your assertions here
	expectedDate := time.Date(2024, 2, 9, 0, 0, 0, 0, time.UTC) // Expected date is February 9, 2024
	if *nextRenewalDate != expectedDate {
		t.Errorf("Expected %v, got %v", expectedDate, nextRenewalDate)
	}

}

func TestGetNextRunDateDailyWithNegRunDay(t *testing.T) {

	mockDate := time.Date(2024, 1, 30, 0, 0, 0, 0, time.UTC) // Mock date is January 30, 2024

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		Frequency: SpendingLimitFrequency.Monthly,
		RunDay:    Ptr("-1"),
	})

	// Add your assertions here
	expectedDate := time.Date(2024, 1, 31, 0, 0, 0, 0, time.UTC) // Expected date is January 31, 2023
	if *nextRenewalDate != expectedDate {
		t.Errorf("Expected %v, got %v", expectedDate, nextRenewalDate)
	}
}

func TestGetNextRunDateDailyWithStrRunDay(t *testing.T) {
	mockDate := time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC) // Mock date is January 2, 2024

	// Call the function you want to test here
	nextRenewalDate := NewScheduleDayUtils(mockDate).GetNextRunDate(IScheduleTaskRecurrence{
		Frequency: SpendingLimitFrequency.Monthly,
		RunDay:    Ptr("2w.1d"),
	})

	// Add your assertions here
	expectedDate := time.Date(2024, 2, 5, 0, 0, 0, 0, time.UTC)
	if *nextRenewalDate != expectedDate {
		t.Errorf("Expected %v, got %v", expectedDate, nextRenewalDate) // Expected date is February 5, 2024
	}

}

func TestGetCurrentTimeWindowFirst30(t *testing.T) {
	mockTime := time.Date(2024, 1, 1, 06, 25, 0, 0, time.UTC) // Mock date is January 1, 2024 06:25:00
	window := GetCurrentThirtyMinutesTimeWindow(mockTime)

	expectedStart := time.Date(2024, 1, 1, 06, 0, 0, 0, time.UTC)
	expectedEnd := time.Date(2024, 1, 1, 06, 29, 0, 0, time.UTC)

	if window.Start != expectedStart {
		t.Errorf("Expected %v, got %v", expectedStart, window.Start)
	}

	if window.End != expectedEnd {
		t.Errorf("Expected %v, got %v", expectedEnd, window.End)
	}
}

func TestGetCurrentTimeWindowSecond30(t *testing.T) {
	mockTime := time.Date(2024, 1, 1, 06, 30, 0, 0, time.UTC) // Mock date is January 1, 2024 06:25:00
	window := GetCurrentThirtyMinutesTimeWindow(mockTime)

	expectedStart := time.Date(2024, 1, 1, 06, 30, 0, 0, time.UTC)
	expectedEnd := time.Date(2024, 1, 1, 06, 59, 0, 0, time.UTC)

	if window.Start != expectedStart {
		t.Errorf("Expected %v, got %v", expectedStart, window.Start)
	}

	if window.End != expectedEnd {
		t.Errorf("Expected %v, got %v", expectedEnd, window.End)
	}
}

func TestGetCurrentMonthTimeWindow(t *testing.T) {
	mockTime := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC) // Mock date is January 15, 2024

	window := GetCurrentMonthTimeWindow(mockTime)

	expectedStart := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)           // Expected start is January 1, 2024
	expectedEnd := time.Date(2024, 1, 31, 23, 59, 59, 999999999, time.UTC) // Expected end is January 31, 2024

	if window.Start != expectedStart {
		t.Errorf("Expected %v, got %v", expectedStart, window.Start)
	}

	if window.End != expectedEnd {
		t.Errorf("Expected %v, got %v", expectedEnd, window.End)
	}
}

func TestGetCurrentMonthTimeWindowUpUntilNow(t *testing.T) {
	mockTime := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC) // Mock date is January 15, 2024

	window := GetCurrentMonthTimeWindow(mockTime, true)

	expectedStart := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC) // Expected start is January 1, 2024
	expectedEnd := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC)  // Expected end is January 15, 2024

	if window.Start != expectedStart {
		t.Errorf("Expected %v, got %v", expectedStart, window.Start)
	}

	if window.End != expectedEnd {
		t.Errorf("Expected %v, got %v", expectedEnd, window.End)
	}
}

func TestCheckIfWithinCurrentTimeWindow(t *testing.T) {
	window := ScheduleTimeWindow{
		Start: time.Date(2024, 1, 1, 06, 30, 0, 0, time.UTC), // January 1, 2024 06:30:00
		End:   time.Date(2024, 1, 1, 07, 0, 0, 0, time.UTC),  // January 1, 2024 07:00:00
	}

	// Test a time within the window
	t1 := time.Date(2024, 1, 1, 06, 45, 0, 0, time.UTC) // January 1, 2024 06:45:00
	if !CheckIfWithinTimeWindow(t1, window) {
		t.Errorf("Expected time %v to be within the window", t1)
	}

	// Test a time before the window
	t2 := time.Date(2024, 1, 1, 06, 25, 0, 0, time.UTC) // January 1, 2024 06:25:00
	if CheckIfWithinTimeWindow(t2, window) {
		t.Errorf("Expected time %v to be outside the window", t2)
	}

	// Test a time after the window
	t3 := time.Date(2024, 1, 1, 07, 05, 0, 0, time.UTC) // January 1, 2024 07:05:00
	if CheckIfWithinTimeWindow(t3, window) {
		t.Errorf("Expected time %v to be outside the window", t3)
	}
}

func TestGetNextWeekTimeWindow(t *testing.T) {
	mockTime := time.Date(2024, 1, 1, 06, 30, 0, 0, time.UTC) // Mock date is January 1, 2024 06:30:00
	window := GetNextWeekTimeWindow(mockTime)

	expectedStart := time.Date(2024, 1, 8, 00, 0, 0, 0, time.UTC)          // January 8, 2024 00:00:00
	expectedEnd := time.Date(2024, 1, 14, 23, 59, 59, 999999999, time.UTC) // January 14, 2024 23:59:59

	if window.Start != expectedStart {
		t.Errorf("Expected %v, got %v", expectedStart, window.Start)
	}

	if window.End != expectedEnd {
		t.Errorf("Expected %v, got %v", expectedEnd, window.End)
	}
}

func TestGetNextDayTimeWindow(t *testing.T) {
	mockTime := time.Date(2024, 1, 1, 06, 30, 0, 0, time.UTC) // Mock date is January 1, 2024 06:30:00
	window := GetNextDayTimeWindow(mockTime)

	expectedStart := time.Date(2024, 1, 2, 00, 0, 0, 0, time.UTC)         // January 2, 2024 00:00:00
	expectedEnd := time.Date(2024, 1, 2, 23, 59, 59, 999999999, time.UTC) // January 2, 2024 23:59:59

	if window.Start != expectedStart {
		t.Errorf("Expected %v, got %v", expectedStart, window.Start)
	}

	if window.End != expectedEnd {
		t.Errorf("Expected %v, got %v", expectedEnd, window.End)
	}
}

func TestGetPrevDayTimeWindow(t *testing.T) {
	mockTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC) // Mock date is January 1, 2024

	window := GetPrevDayTimeWindow(mockTime)

	expectedStart := time.Date(2023, 12, 31, 0, 0, 0, 0, time.UTC)          // Expected start is December 31, 2023
	expectedEnd := time.Date(2023, 12, 31, 23, 59, 59, 999999999, time.UTC) // Expected end is December 31, 2023

	if window.Start != expectedStart {
		t.Errorf("Expected %v, got %v", expectedStart, window.Start)
	}

	if window.End != expectedEnd {
		t.Errorf("Expected %v, got %v", expectedEnd, window.End)
	}
}

func TestGetWeeksInMonth(t *testing.T) {
	mockTime := time.Date(2024, 1, 1, 06, 30, 0, 0, time.UTC) // Mock date is January 1, 2024 06:30:00
	weeks := GetWeeksInMonth(carbon.NewCarbon(mockTime))

	expectedWeeks := 5

	if weeks != expectedWeeks {
		t.Errorf("Expected %v, got %v", expectedWeeks, weeks)
	}
}
func TestGetNextThirtyMinutesTimeWindow(t *testing.T) {
	mockTime := time.Date(2024, 1, 1, 06, 58, 0, 0, time.UTC) // Mock date is January 1, 2024 06:58:00
	window := GetNextThirtyMinutesTimeWindow(mockTime)

	expectedStart := time.Date(2024, 1, 1, 07, 0, 0, 0, time.UTC) // January 1, 2024 07:00:00
	expectedEnd := time.Date(2024, 1, 1, 07, 29, 0, 0, time.UTC)  // January 1, 2024 07:29:00

	if window.Start != expectedStart {
		t.Errorf("Expected %v, got %v", expectedStart, window.Start)
	}

	if window.End != expectedEnd {
		t.Errorf("Expected %v, got %v", expectedEnd, window.End)
	}
}
func TestScheduleTimeWindow_String(t *testing.T) {
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 31, 1, 0, 0, 0, time.UTC)
	window := ScheduleTimeWindow{
		Start: start,
		End:   end,
	}

	// Test without layout parameter
	expectedString := "2024-01-01 00:00:00 - 2024-01-31 01:00:00"
	if window.String() != expectedString {
		t.Errorf("Expected %v, got %v", expectedString, window.String())
	}

	// Test with layout parameter
	layout := "Jan 2, 2006 15:04:05"
	expectedStringWithLayout := "Jan 1, 2024 00:00:00 - Jan 31, 2024 01:00:00"
	if window.String(layout) != expectedStringWithLayout {
		t.Errorf("Expected %v, got %v", expectedStringWithLayout, window.String(layout))
	}

	// Test with layout parameter
	layout2 := "Jan 2, 2006"
	expectedStringWithLayout2 := "Jan 1, 2024 - Jan 31, 2024"
	if window.String(layout2) != expectedStringWithLayout2 {
		t.Errorf("Expected %v, got %v", expectedStringWithLayout2, window.String(layout2))
	}
}

func TestScheduleTimeWindow_Diff(t *testing.T) {
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 1, 1, 0, 0, 0, time.UTC)
	window := ScheduleTimeWindow{
		Start: start,
		End:   end,
	}

	expectedDiff := time.Hour

	diff := window.Diff()

	if diff != expectedDiff {
		t.Errorf("Expected %v, got %v", expectedDiff, diff)
	}
}

func TestGetHourAndMinute(t *testing.T) {
	hourTime := "09:30"
	expectedHour := 9
	expectedMinute := 30

	hour, minute := getHourAndMinute(hourTime)

	if hour != expectedHour {
		t.Errorf("Expected hour to be %d, but got %d", expectedHour, hour)
	}

	if minute != expectedMinute {
		t.Errorf("Expected minute to be %d, but got %d", expectedMinute, minute)
	}
}
func TestIsTimeToday(t *testing.T) {
	now := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC) // Mock current date is January 1, 2024

	// Test case where the time is today
	today := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	if !IsTimeToday(today, now) {
		t.Errorf("Expected %v to be today", today)
	}

	// Test case where the time is not today (yesterday)
	yesterday := time.Date(2023, 12, 31, 23, 59, 59, 999999999, time.UTC)
	if IsTimeToday(yesterday, now) {
		t.Errorf("Expected %v to not be today", yesterday)
	}

	// Test case where the time is not today (tomorrow)
	tomorrow := time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC)
	if IsTimeToday(tomorrow, now) {
		t.Errorf("Expected %v to not be today", tomorrow)
	}
}

func TestIsTimeYesterday(t *testing.T) {
	now := time.Date(2024, 1, 2, 12, 0, 0, 0, time.UTC) // Mock current date is January 2, 2024

	// Test case where the time is yesterday
	yesterday := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	if !IsTimeYesterday(yesterday, now) {
		t.Errorf("Expected %v to be yesterday", yesterday)
	}

	// Test case where the time is not yesterday (today)
	today := time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC)
	if IsTimeYesterday(today, now) {
		t.Errorf("Expected %v to not be yesterday", today)
	}

	// Test case where the time is not yesterday (two days ago)
	twoDaysAgo := time.Date(2023, 12, 31, 0, 0, 0, 0, time.UTC)
	if IsTimeYesterday(twoDaysAgo, now) {
		t.Errorf("Expected %v to not be yesterday", twoDaysAgo)
	}

	// Test case where the time is not yesterday (tomorrow)
	tomorrow := time.Date(2024, 1, 3, 0, 0, 0, 0, time.UTC)
	if IsTimeYesterday(tomorrow, now) {
		t.Errorf("Expected %v to not be yesterday", tomorrow)
	}
}

func TestIsTimeTomorrow(t *testing.T) {
	now := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC) // Mock current date is January 1, 2024

	// Test case where the time is tomorrow
	tomorrow := time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC)
	if !IsTimeTomorrow(tomorrow, now) {
		t.Errorf("Expected %v to be tomorrow", tomorrow)
	}

	// Test case where the time is not tomorrow (today)
	today := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	if IsTimeTomorrow(today, now) {
		t.Errorf("Expected %v to not be tomorrow", today)
	}

	// Test case where the time is not tomorrow (day after tomorrow)
	dayAfterTomorrow := time.Date(2024, 1, 3, 0, 0, 0, 0, time.UTC)
	if IsTimeTomorrow(dayAfterTomorrow, now) {
		t.Errorf("Expected %v to not be tomorrow", dayAfterTomorrow)
	}

	// Test case where the time is not tomorrow (yesterday)
	yesterday := time.Date(2023, 12, 31, 0, 0, 0, 0, time.UTC)
	if IsTimeTomorrow(yesterday, now) {
		t.Errorf("Expected %v to not be tomorrow", yesterday)
	}
}
