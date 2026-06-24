"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = JoinRequestModal;
const react_1 = require("react");
const client_1 = require("@/lib/api/client");
function JoinRequestModal({ teamId, isOpen, onClose, onSuccess }) {
    const [message, setMessage] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await (0, client_1.createJoinRequest)(teamId, { message: message || undefined });
            onSuccess();
            onClose();
            setMessage('');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка отправки заявки');
        }
        finally {
            setLoading(false);
        }
    };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">Заявка на вступление</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Сообщение (необязательно)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Расскажите о себе, почему хотите вступить..." className="input-field" rows={4} maxLength={500}/>
          </div>

          {error && (<div className="p-3 rounded-lg bg-error/10 text-error text-sm">
              {error}
            </div>)}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Отправка...' : 'Отправить заявку'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>);
}
//# sourceMappingURL=JoinRequestModal.js.map