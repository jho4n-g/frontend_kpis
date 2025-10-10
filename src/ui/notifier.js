// Pequeño puente para usar notify fuera de React (p. ej. en servicios/axios)
let _notify = null;

export function setNotifyImpl(impl) {
  _notify = impl; // { notify, success, info, warn, error }
}

export const Notifier = {
  success: (m, ms) => _notify?.success?.(m, ms),
  info: (m, ms) => _notify?.info?.(m, ms),
  warn: (m, ms) => _notify?.warn?.(m, ms),
  error: (m, ms) => _notify?.error?.(m, ms),
  notify: (o) => _notify?.notify?.(o),
};
