import messages from '../data/mobile-messages.json';

function outline({width:w,height:h,radius:r,side,tailHeight:th,tailWidth:tw,tailControl:control}) {
  const top=`M ${r} 0 H ${w-r} A ${r} ${r} 0 0 1 ${w} ${r}`;
  if(side==='right') return `${top} V ${h-th} C ${w} ${h-th*2/3} ${w+control} ${h-th/3} ${w+tw} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h-r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  return `${top} V ${h-r} A ${r} ${r} 0 0 1 ${w-r} ${h} H ${-tw} C ${-control} ${h-th/3} 0 ${h-th*2/3} 0 ${h-th} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

export default function MobileMessages() {
  return (
    <aside className="mobile-messages" aria-label="Диалоги античных фигур">
      {messages.map((message, index) => (
        <div key={message.id} className="mobile-message" data-message-id={message.id}
          data-intro-dialog={message.id.startsWith('hermes-') ? index : undefined}
          style={{left:message.x,top:message.y,width:message.width,height:message.height}}>
          <span className="sr-only">{message.lines.join(' ')}</span>
          <svg className="mobile-message-outline" aria-hidden="true" width={message.width+message.tailWidth*2} height={message.height}
            style={{left:-message.tailWidth}} viewBox={`${-message.tailWidth} 0 ${message.width+message.tailWidth*2} ${message.height}`}>
            <path d={outline(message)} fill="#d9d9d9" />
          </svg>
          <svg className="mobile-message-text" aria-hidden="true" width={message.width} height={message.height}>
            <text fill="#101010" fontFamily="Arimo" fontSize="15" xmlSpace="preserve">
              {message.lines.map((line,index) => <tspan key={index} x={message.textX} y={message.baselines[index]}>{line}</tspan>)}
            </text>
          </svg>
        </div>
      ))}
    </aside>
  );
}
