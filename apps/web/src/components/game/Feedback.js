"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Feedback;
const react_1 = require("react");
function Feedback({ type, message, points, visible }) {
    const [show, setShow] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (!visible)
            return;
        setShow(true);
        const timer = setTimeout(() => setShow(false), 2000);
        return () => clearTimeout(timer);
    }, [visible]);
    if (!show)
        return null;
    return (<div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Background flash */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${type === 'success' ? 'bg-success/20' : 'bg-error/20'} ${show ? 'opacity-100' : 'opacity-0'}`}/>

      {/* Feedback card */}
      <div className={`
          relative bg-background border-2 rounded-xl p-8 shadow-2xl
          transform transition-all duration-500
          ${type === 'success' ? 'border-success' : 'border-error'}
          ${show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}>
        <div className="text-center">
          {/* Icon */}
          <div className="text-6xl mb-4">
            {type === 'success' ? '✅' : '❌'}
          </div>

          {/* Message */}
          <div className="text-2xl font-bold text-text-primary mb-2">
            {message}
          </div>

          {/* Points */}
          <div className={`text-4xl font-bold ${points > 0 ? 'text-success' : points < 0 ? 'text-error' : 'text-text-secondary'}`}>
            {points > 0 ? '+' : ''}{points}
            <span className="text-lg ml-1">очков</span>
          </div>
        </div>

        {/* Animated particles */}
        {type === 'success' && (<div className="absolute inset-0 overflow-hidden rounded-xl">
            {[...Array(10)].map((_, i) => (<div key={i} className="absolute w-2 h-2 bg-success rounded-full animate-ping" style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: '1s',
                }}/>))}
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=Feedback.js.map