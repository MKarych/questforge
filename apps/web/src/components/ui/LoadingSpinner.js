"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoadingSpinner;
const utils_1 = require("@/lib/utils");
function LoadingSpinner({ size = 'md', className }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };
    return (<div className={(0, utils_1.cn)('flex items-center justify-center', className)}>
      <div className={(0, utils_1.cn)('animate-spin rounded-full border-2 border-border border-t-primary', sizeClasses[size])}/>
    </div>);
}
//# sourceMappingURL=LoadingSpinner.js.map