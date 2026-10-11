package app

import (
	"errors"
	"net/http"

	"iosbackup/internal/i18n"
)

func localizedLoginError(r *http.Request, code string) string {
	if code == "" {
		return ""
	}
	return i18n.Text(i18n.ResolveRequest(r), code, nil)
}

// Locale is request-scoped. This middleware does not wrap ResponseWriter, preserving SSE Flusher.
func localeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Language", i18n.ResolveRequest(r))
		w.Header().Add("Vary", "Accept-Language")
		w.Header().Add("Vary", "Cookie")
		next.ServeHTTP(w, r)
	})
}

func apiMessage(w http.ResponseWriter, code string, params map[string]any, failure bool) map[string]any {
	if params == nil {
		params = map[string]any{}
	}
	payload := map[string]any{"code": code, "message_code": code, "params": params}
	field := "message"
	if failure {
		field = "error"
	}
	payload[field] = i18n.Text(w.Header().Get("Content-Language"), code, params)
	return payload
}

func operationErrorPayload(w http.ResponseWriter, err error, fallbackCode string) map[string]any {
	var translated *i18n.Error
	if errors.As(err, &translated) {
		payload := apiMessage(w, translated.Code, translated.Params, true)
		if translated.Detail != "" {
			payload["detail"] = translated.Detail
		}
		return payload
	}
	code := fallbackCode
	switch {
	case errors.Is(err, errDeviceNotFound):
		code = "api.device_not_found"
	case errors.Is(err, errDeviceBusy):
		code = "api.busy"
	case errors.Is(err, errDeviceRemoved):
		code = "api.device_removed_operation"
	case errors.Is(err, errDeviceRemovalPending):
		code = "api.removal_pending"
	case errors.Is(err, errConnectionRestarting):
		code = "api.connection_restarting"
	case errors.Is(err, errConnectionUnavailable):
		code = "api.connection_unavailable"
	case errors.Is(err, errDeviceDisconnected):
		code = "api.device_disconnected"
	}
	payload := apiMessage(w, code, nil, true)
	// Unknown tool and OS output is diagnostic data, never a translatable message identifier.
	if code == fallbackCode && err != nil {
		payload["detail"] = err.Error()
	}
	return payload
}

func writeOperationError(w http.ResponseWriter, status int, err error, fallbackCode string) {
	writeJSON(w, status, operationErrorPayload(w, err, fallbackCode))
}

func handleAPIMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		writeError(w, http.StatusMethodNotAllowed, "api.method_not_allowed")
		return
	}
	w.Header().Del("Vary")
	w.Header().Del("Content-Language")
	w.Header().Set("Content-Type", "text/javascript; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	if r.Method == http.MethodGet {
		_, _ = w.Write(i18n.CatalogJavaScript())
	}
}
