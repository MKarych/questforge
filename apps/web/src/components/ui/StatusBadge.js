"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StatusBadge;
const utils_1 = require("@/lib/utils");
function StatusBadge({ status, className }) {
    const normalizedStatus = status.toUpperCase();
    const getStatusConfig = () => {
        switch (normalizedStatus) {
            case 'DRAFT':
                return {
                    label: 'Черновик',
                    className: 'bg-surface-elevated text-text-muted',
                };
            case 'PENDING':
                return {
                    label: 'На модерации',
                    className: 'bg-warning/10 text-warning',
                };
            case 'APPROVED':
                return {
                    label: 'Одобрено',
                    className: 'bg-success/10 text-success',
                };
            case 'IN_PROGRESS':
            case 'STARTED':
                return {
                    label: 'Активна',
                    className: 'bg-success/10 text-success',
                };
            case 'FINISHED':
                return {
                    label: 'Завершена',
                    className: 'bg-surface-elevated text-text-secondary',
                };
            case 'REJECTED':
                return {
                    label: 'Отклонено',
                    className: 'bg-error/10 text-error',
                };
            default:
                return {
                    label: status,
                    className: 'bg-surface-elevated text-text-secondary',
                };
        }
    };
    const config = getStatusConfig();
    return (<span className={(0, utils_1.cn)('inline-block px-2 py-1 rounded text-xs font-medium', config.className, className)}>
      {config.label}
    </span>);
}
//# sourceMappingURL=StatusBadge.js.map