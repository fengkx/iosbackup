package app

import (
	"bytes"
	"log"
	"strings"
	"testing"
)

func TestLogConfigurationHasStableEnglishEvent(t *testing.T) {
	previousLevel := currentLogLevel
	previousWriter := log.Writer()
	t.Cleanup(func() { currentLogLevel = previousLevel; log.SetOutput(previousWriter) })
	t.Setenv("LOG_LEVEL", "WARN")
	var output bytes.Buffer
	log.SetOutput(&output)
	initLogLevel()
	if !strings.Contains(output.String(), "event=logging.configured level=WARN") {
		t.Fatalf("missing stable log event: %s", output.String())
	}
	app := newApplication()
	app.addInfoLog("PHONE", "event=test.hidden")
	app.addErrorLog("PHONE", "event=test.failure")
	if strings.Contains(output.String(), "event=test.hidden") || !strings.Contains(output.String(), "PHONE: event=test.failure") {
		t.Fatalf("log filtering or device context changed: %s", output.String())
	}
}
