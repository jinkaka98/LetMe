var LetMeContentScript=(function(R){"use strict";function H(c){const t=c.getBoundingClientRect(),e=window.getComputedStyle(c),i=r=>{const l=parseFloat(r);return isNaN(l)?0:l},o={top:i(e.marginTop),right:i(e.marginRight),bottom:i(e.marginBottom),left:i(e.marginLeft)},n={top:i(e.borderTopWidth),right:i(e.borderRightWidth),bottom:i(e.borderBottomWidth),left:i(e.borderLeftWidth)},s={top:i(e.paddingTop),right:i(e.paddingRight),bottom:i(e.paddingBottom),left:i(e.paddingLeft)},a={width:Math.max(0,t.width-n.left-n.right-s.left-s.right),height:Math.max(0,t.height-n.top-n.bottom-s.top-s.bottom)};return{width:Math.round(t.width*100)/100,height:Math.round(t.height*100)/100,margin:o,border:n,padding:s,content:{width:Math.round(a.width*100)/100,height:Math.round(a.height*100)/100},boundingBox:{x:Math.round(t.x),y:Math.round(t.y),top:Math.round(t.top),right:Math.round(t.right),bottom:Math.round(t.bottom),left:Math.round(t.left),width:Math.round(t.width),height:Math.round(t.height)}}}function W(c){const t=c.parentElement;if(!t)return{parentTagName:"none",parentSelector:"none",display:"none",position:"static",isFlexChild:!1,isGridChild:!1};const e=window.getComputedStyle(t),i=e.display.includes("flex"),o=e.display.includes("grid"),n={parentTagName:t.tagName.toLowerCase(),parentSelector:O(t),display:e.display,position:e.position,isFlexChild:i,isGridChild:o};return i&&(n.flexParent={flexDirection:e.flexDirection,justifyContent:e.justifyContent,alignItems:e.alignItems,flexWrap:e.flexWrap,gap:e.gap||"normal",rowGap:e.rowGap||"normal",columnGap:e.columnGap||"normal"}),o&&(n.gridParent={gridTemplateColumns:e.gridTemplateColumns,gridTemplateRows:e.gridTemplateRows,gridAutoFlow:e.gridAutoFlow,gap:e.gap||"normal"}),n}function D(c){const t=[],e=c.getBoundingClientRect(),i=window.getComputedStyle(c),o=window.innerWidth,n=document.documentElement.scrollWidth,s=document.documentElement.clientWidth;let a=!1;n>s+2&&e.right>s&&(a=!0,t.push(`Element right edge (${Math.round(e.right)}px) leaks beyond document width (${s}px), causing horizontal scroll.`));let r=!1,l,d=c.parentElement;for(;d&&d!==document.body&&d!==document.documentElement;){const x=window.getComputedStyle(d),m=d.getBoundingClientRect();if(x.overflow==="hidden"||x.overflowX==="hidden"||x.overflowY==="hidden"||x.overflow==="clip"){const v=e.top<m.top,w=e.bottom>m.bottom,M=e.left<m.left,$=e.right>m.right;if(v||w||M||$){r=!0,l=O(d),t.push(`Element is clipped by ancestor <${d.tagName.toLowerCase()}> with overflow: ${x.overflow}.`);break}}d=d.parentElement}const g=i.zIndex,y=g!=="auto"&&g!=="0",p=[];let h=c.parentElement;for(;h&&h!==document.body;){const x=window.getComputedStyle(h);x.zIndex!=="auto"&&p.push(`${h.tagName.toLowerCase()} (z-index: ${x.zIndex})`),h=h.parentElement}let u;return e.left<8&&e.width>0?u=`Element touches or sits extremely close to left viewport edge (${Math.round(e.left)}px).`:o-e.right<8&&e.width>0&&(u=`Element touches or sits extremely close to right viewport edge (${Math.round(o-e.right)}px).`),{hasHorizontalScrollLeak:a,isClippedByAncestor:r,clippingAncestorSelector:l,hasZIndexConflict:y&&p.length>0,zIndex:g,zIndexParentStack:p.length>0?p:void 0,safeAreaWarning:u,warnings:t}}function O(c){if(c.id)return`#${CSS.escape(c.id)}`;if(c.dataset&&c.dataset.testid)return`[data-testid="${c.dataset.testid}"]`;const t=[];let e=c;for(;e&&e!==document.body&&e!==document.documentElement;){let i=e.tagName.toLowerCase();if(e.id){i+=`#${CSS.escape(e.id)}`,t.unshift(i);break}if(e.classList.length>0){const n=Array.from(e.classList).filter(s=>!s.startsWith("letme-")&&!s.includes(":")).slice(0,2);n.length>0&&(i+=`.${n.map(s=>CSS.escape(s)).join(".")}`)}const o=e.parentElement;if(o){const n=Array.from(o.children).filter(s=>s.tagName===e.tagName);if(n.length>1){const s=n.indexOf(e)+1;i+=`:nth-of-type(${s})`}}t.unshift(i),e=e.parentElement}return t.join(" > ")}function j(c){const t=c.cloneNode(!0);t.querySelectorAll('script, style, [class*="letme-"]').forEach(n=>n.remove());const i=Array.from(t.children);if(i.length>10){for(let s=10;s<i.length;s++)i[s].remove();const n=document.createElement("div");n.innerText=`<!-- ... ${i.length-10} more sibling elements truncated ... -->`,t.appendChild(n)}const o=t.outerHTML;return o.length>4e3?o.substring(0,3950)+`
<!-- ... content truncated for brevity ... -->`:o}function _(c){const t=window.getComputedStyle(c),e=["display","position","box-sizing","width","height","min-width","max-width","min-height","max-height","margin","padding","border","border-radius","background-color","color","font-family","font-size","font-weight","line-height","text-align","flex-direction","justify-content","align-items","gap","overflow","z-index","opacity","transform"],i={};for(const o of e){const n=t.getPropertyValue(o);n&&n!=="none"&&n!=="normal"&&n!=="auto"&&n!=="rgba(0, 0, 0, 0)"&&(i[o]=n)}return i}const U=["amber","rose","sky","mint","dark"],V={amber:{id:"amber",label:"Amber",bg:"#fef08a",headerBg:"#fde047",border:"#ca8a04",text:"#422006",muted:"#713f12"},rose:{id:"rose",label:"Rose",bg:"#fecdd3",headerBg:"#fda4af",border:"#e11d48",text:"#4c0519",muted:"#881337"},sky:{id:"sky",label:"Sky",bg:"#bae6fd",headerBg:"#7dd3fc",border:"#0284c7",text:"#082f49",muted:"#0c4a6e"},mint:{id:"mint",label:"Mint",bg:"#bbf7d0",headerBg:"#86efac",border:"#16a34a",text:"#052e16",muted:"#14532d"},dark:{id:"dark",label:"Blueprint",bg:"#18181b",headerBg:"#27272a",border:"#52525b",text:"#fafafa",muted:"#a1a1aa"}};function Y(c){return V[c||"amber"]||V.amber}function et(c){const t=U.indexOf(c||"amber");return U[(t+1)%U.length]}function q(c,t){const e=Y(t.theme),i=t.scale??1,o=8*i,n=22*i,s=10*i,{x:a,y:r,width:l,height:d}=t;c.save(),c.shadowColor="rgba(0,0,0,0.35)",c.shadowBlur=12*i,c.shadowOffsetY=4*i,c.beginPath(),c.roundRect(a,r,l,d,o),c.fillStyle=e.bg,c.fill(),c.shadowColor="transparent",c.lineWidth=Math.max(1,1.5*i),c.strokeStyle=e.border,c.stroke(),c.save(),c.beginPath(),c.roundRect(a,r,l,n,[o,o,0,0]),c.fillStyle=e.headerBg,c.fill(),c.restore(),c.beginPath(),c.moveTo(a,r+n),c.lineTo(a+l,r+n),c.strokeStyle=e.border,c.lineWidth=Math.max(.75,1*i),c.stroke();const g=Math.max(11,Math.round(12*i));c.font=`500 ${g}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,c.fillStyle=e.text,c.textBaseline="top";const y=Math.max(20,l-s*2),p=g*1.4,h=(t.text||"").split(`
`);let u=r+n+s*.8;for(const x of h){const m=x.split(" ");let b="";for(const v of m){const w=b?`${b} ${v}`:v;c.measureText(w).width>y&&b?(u+p<=r+d-s*.5&&(c.fillText(b,a+s,u),u+=p),b=v):b=w}b&&u+p<=r+d-s*.5&&(c.fillText(b,a+s,u),u+=p)}c.restore()}const it=new Set(["box","rounded-box","circle","diamond","triangle","callout"]);class X{canvas;ctx;annotations=[];undoStack=[];redoStack=[];currentTool="pen";currentColor="#ffffff";currentStrokeWidth=2;currentFontFamily="Arial, Helvetica, sans-serif";isDrawing=!1;currentAnnotation=null;onChangeCallback=null;selectedId=null;activeHandle=null;lastDragPt={x:0,y:0};initialBBox=null;initialAnnotationSnapshot=null;hoveredEraseId=null;stickyHost;stickyShadow;mode;constructor(t,e,i){this.mode=i?.mode||"fullscreen";const o=i?.container||document.body;this.canvas=document.createElement("canvas"),this.canvas.className="letme-markup-canvas",this.canvas.width=t,this.canvas.height=e,this.mode==="contained"?(this.canvas.style.position="absolute",this.canvas.style.inset="0",this.canvas.style.width="100%",this.canvas.style.height="100%",this.canvas.style.zIndex="2"):(this.canvas.style.position="fixed",this.canvas.style.top="0",this.canvas.style.left="0",this.canvas.style.width="100vw",this.canvas.style.height="100vh",this.canvas.style.zIndex="2147483640"),this.canvas.style.pointerEvents="auto",this.canvas.style.cursor="crosshair";const n=this.canvas.getContext("2d");if(!n)throw new Error("Canvas 2D context not available");this.ctx=n,this.stickyHost=document.createElement("div"),this.stickyHost.id=this.mode==="contained"?"letme-sticky-contained-root":"letme-sticky-overlay-root",this.stickyHost.style.position=this.mode==="contained"?"absolute":"fixed",this.stickyHost.style.inset="0",this.stickyHost.style.zIndex=this.mode==="contained"?"5":"2147483641",this.stickyHost.style.pointerEvents="none",this.stickyShadow=this.stickyHost.attachShadow({mode:"open"}),this.stickyShadow.innerHTML=`
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .sn-card {
          position: ${this.mode==="contained"?"absolute":"fixed"}; width: 210px; min-height: 116px; border-radius: 8px;
          border: 1.5px solid #ca8a04; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
          display: flex; flex-direction: column; pointer-events: auto; line-height: normal;
        }
        .sn-head {
          height: 24px; padding: 0 6px; border-radius: 6px 6px 0 0;
          display: flex; align-items: center; justify-content: space-between;
          cursor: grab; user-select: none; border-bottom: 1px solid rgba(0,0,0,0.12);
        }
        .sn-head:active { cursor: grabbing; }
        .sn-dots { font-size: 10px; opacity: 0.55; letter-spacing: 1px; }
        .sn-actions { display: flex; align-items: center; gap: 2px; }
        .sn-icon-btn {
          width: 20px; height: 20px; border: none; background: transparent;
          color: inherit; border-radius: 4px; cursor: pointer; padding: 0;
          display: inline-flex; align-items: center; justify-content: center; opacity: 0.78;
        }
        .sn-icon-btn:hover { background: rgba(0,0,0,0.12); opacity: 1; }
        .sn-body {
          flex: 1; width: 100%; min-height: 90px; border: none; background: transparent;
          color: inherit; padding: 8px 10px; font-size: 12px; line-height: 1.4;
          resize: both; outline: none; font-family: inherit;
        }
      </style>
      <div id="sn-container"></div>
    `,i?.container&&o.appendChild(this.canvas),o.appendChild(this.stickyHost),this.attachEvents()}getCanvasElement(){return this.canvas}setOnChange(t){this.onChangeCallback=t}emitChange(){this.onChangeCallback?.([...this.annotations])}cloneAnnotation(t){return{...t,points:t.points?t.points.map(e=>({...e})):void 0,startPoint:t.startPoint?{...t.startPoint}:void 0,endPoint:t.endPoint?{...t.endPoint}:void 0,blurArea:t.blurArea?{...t.blurArea}:void 0}}pushHistory(){this.undoStack.push(this.annotations.map(t=>this.cloneAnnotation(t))),this.undoStack.length>40&&this.undoStack.shift(),this.redoStack=[]}setAnnotations(t){this.annotations=t.map(e=>this.cloneAnnotation(e)),this.undoStack=[],this.redoStack=[],this.selectedId=null,this.hoveredEraseId=null,this.redraw()}setTool(t){this.currentTool=t,this.hoveredEraseId=null,t!=="select"&&(this.selectedId=null),t==="select"?this.canvas.style.cursor="default":t==="eraser"?this.canvas.style.cursor="pointer":t==="text"?this.canvas.style.cursor="text":this.canvas.style.cursor="crosshair",this.redraw()}setColor(t){this.currentColor=t}setStrokeWidth(t){this.currentStrokeWidth=Math.max(1,Math.min(24,t))}setFontFamily(t){this.currentFontFamily=t}getAnnotations(){return this.annotations}undo(){if(!(this.annotations.length===0&&this.undoStack.length===0)){if(this.undoStack.length>0)this.redoStack.push(this.annotations.map(t=>this.cloneAnnotation(t))),this.annotations=this.undoStack.pop();else{const t=this.annotations.pop();t&&this.redoStack.push([t])}this.selectedId=null,this.redraw(),this.emitChange()}}redo(){this.redoStack.length!==0&&(this.undoStack.push(this.annotations.map(t=>this.cloneAnnotation(t))),this.annotations=this.redoStack.pop(),this.selectedId=null,this.redraw(),this.emitChange())}clear(){this.annotations.length!==0&&(this.pushHistory(),this.annotations=[],this.selectedId=null,this.hoveredEraseId=null,this.redraw(),this.emitChange())}attachEvents(){this.canvas.addEventListener("mousedown",t=>this.onMouseDown(t)),this.canvas.addEventListener("mousemove",t=>this.onMouseMove(t)),this.canvas.addEventListener("mouseup",()=>this.onMouseUp()),this.canvas.addEventListener("mouseleave",()=>this.onMouseUp())}getPoint(t){const e=this.canvas.getBoundingClientRect(),i=this.canvas.width/e.width,o=this.canvas.height/e.height;return{x:(t.clientX-e.left)*i,y:(t.clientY-e.top)*o}}distToSegment(t,e,i){const o=i.x-e.x,n=i.y-e.y,s=o*o+n*n;if(s===0)return Math.hypot(t.x-e.x,t.y-e.y);let a=((t.x-e.x)*o+(t.y-e.y)*n)/s;return a=Math.max(0,Math.min(1,a)),Math.hypot(t.x-(e.x+a*o),t.y-(e.y+a*n))}getAnnotationBBox(t){if(t.type==="pen"&&t.points&&t.points.length>0){let e=1/0,i=1/0,o=-1/0,n=-1/0;for(const s of t.points)s.x<e&&(e=s.x),s.y<i&&(i=s.y),s.x>o&&(o=s.x),s.y>n&&(n=s.y);return{x:e,y:i,w:Math.max(12,o-e),h:Math.max(12,n-i)}}if(t.type==="text"&&t.startPoint&&t.text){const e=Math.max(13,(t.strokeWidth||2)*4+6),i=t.fontFamily||this.currentFontFamily;this.ctx.save(),this.ctx.font=`700 ${e}px ${i}`;const o=this.ctx.measureText(t.text).width;return this.ctx.restore(),{x:t.startPoint.x,y:t.startPoint.y-e*.85,w:Math.max(24,o+4),h:e+4}}if(t.startPoint&&t.endPoint){const e=Math.min(t.startPoint.x,t.endPoint.x),i=Math.min(t.startPoint.y,t.endPoint.y),o=Math.max(12,Math.abs(t.endPoint.x-t.startPoint.x)),n=Math.max(12,Math.abs(t.endPoint.y-t.startPoint.y));return{x:e,y:i,w:o,h:n}}return null}toLocalPt(t,e,i=0){if(!i)return t;const o=e.x+e.w/2,n=e.y+e.h/2,s=t.x-o,a=t.y-n,r=Math.cos(-i),l=Math.sin(-i);return{x:o+s*r-a*l,y:n+s*l+a*r}}getHandlePositions(t){const e=t.x+t.w/2,i=t.y+t.h/2;return{tl:{x:t.x,y:t.y},t:{x:e,y:t.y},tr:{x:t.x+t.w,y:t.y},r:{x:t.x+t.w,y:i},br:{x:t.x+t.w,y:t.y+t.h},b:{x:e,y:t.y+t.h},bl:{x:t.x,y:t.y+t.h},l:{x:t.x,y:i},rotate:{x:e,y:t.y-24}}}hitTestHandles(t,e){const i=this.getAnnotationBBox(e);if(!i)return null;const o=this.toLocalPt(t,i,e.rotation||0),n=this.getHandlePositions(i);for(const s of Object.keys(n)){const a=n[s];if(Math.hypot(o.x-a.x,o.y-a.y)<=13)return s}return null}getHandleCursor(t){return t==="rotate"?"grab":t==="tl"||t==="br"?"nwse-resize":t==="tr"||t==="bl"?"nesw-resize":t==="t"||t==="b"?"ns-resize":"ew-resize"}findAnnotationAt(t){for(let i=this.annotations.length-1;i>=0;i--){const o=this.annotations[i],n=this.getAnnotationBBox(o);if(!n)continue;const s=this.toLocalPt(t,n,o.rotation||0);if(o.type==="pen"&&o.points){for(let a=1;a<o.points.length;a++)if(this.distToSegment(s,o.points[a-1],o.points[a])<=12)return o}else if((o.type==="arrow"||o.type==="line"||o.type==="ruler")&&o.startPoint&&o.endPoint){if(this.distToSegment(s,o.startPoint,o.endPoint)<=12)return o}else if(s.x>=n.x-10&&s.x<=n.x+n.w+10&&s.y>=n.y-10&&s.y<=n.y+n.h+10)return o}return null}onMouseDown(t){if(t.button!==0)return;const e=this.getPoint(t);if(this.currentTool==="eraser"){const o=this.findAnnotationAt(e);o&&(this.pushHistory(),this.annotations=this.annotations.filter(n=>n.id!==o.id),this.hoveredEraseId=null,this.redraw(),this.emitChange());return}if(this.currentTool==="select"){if(this.selectedId){const n=this.annotations.find(s=>s.id===this.selectedId);if(n){const s=this.hitTestHandles(e,n);if(s){this.pushHistory(),this.activeHandle=s,this.lastDragPt=e,this.initialBBox=this.getAnnotationBBox(n),this.initialAnnotationSnapshot=this.cloneAnnotation(n),this.canvas.style.cursor=s==="rotate"?"crosshair":"nwse-resize";return}}}const o=this.findAnnotationAt(e);o?(this.pushHistory(),this.selectedId=o.id,this.activeHandle="move",this.lastDragPt=e,this.canvas.style.cursor="grabbing"):(this.selectedId=null,this.activeHandle=null),this.redraw();return}if(this.currentTool==="text"){const o=this.findAnnotationAt(e);if(o&&o.type==="text"){this.selectedId=o.id,this.activeHandle="move",this.lastDragPt=e,this.canvas.style.cursor="grabbing",this.redraw();return}this.showInlineTextInput(t.clientX,t.clientY,e);return}if(this.currentTool==="sticky"){this.pushHistory();const o=`sn_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,n=210,s=120,a=Math.max(8,Math.min(this.canvas.width-n-8,e.x)),r=Math.max(8,Math.min(this.canvas.height-s-8,e.y));this.annotations.push({id:o,type:"sticky",startPoint:{x:a,y:r},endPoint:{x:a+n,y:r+s},text:"",stickyTheme:"amber"}),this.redraw(),this.renderStickyOverlay(o),this.emitChange();return}this.isDrawing=!0;const i=`ann_${Date.now()}_${Math.random().toString(36).substring(2,6)}`;this.currentTool==="pen"?this.currentAnnotation={id:i,type:"pen",color:this.currentColor,strokeWidth:this.currentStrokeWidth,points:[e]}:this.currentTool==="ruler"?this.currentAnnotation={id:i,type:"ruler",color:this.currentColor,strokeWidth:this.currentStrokeWidth,startPoint:e,endPoint:e,text:"0px"}:this.currentAnnotation={id:i,type:this.currentTool,color:this.currentColor,strokeWidth:this.currentStrokeWidth,startPoint:e,endPoint:e}}showInlineTextInput(t,e,i){document.getElementById("letme-inline-text-input")?.remove();const o=Math.max(13,this.currentStrokeWidth*4+6),n=document.createElement("input");n.id="letme-inline-text-input",n.type="text",n.placeholder="Type text...",n.style.cssText=`position:fixed;left:${Math.min(window.innerWidth-220,Math.max(10,t))}px;top:${Math.min(window.innerHeight-40,Math.max(10,e-o))}px;min-width:140px;max-width:320px;background:rgba(5,5,5,0.55);border:1px dashed ${this.currentColor};border-radius:3px;color:${this.currentColor};font-size:${o}px;font-weight:700;font-family:${this.currentFontFamily};padding:2px 6px;outline:none;z-index:2147483647;`;let s=!1;const a=()=>{if(s)return;s=!0;const r=n.value.trim();r&&(this.pushHistory(),this.annotations.push({id:`ann_text_${Date.now()}`,type:"text",startPoint:i,text:r,color:this.currentColor,strokeWidth:this.currentStrokeWidth,fontFamily:this.currentFontFamily}),this.redraw(),this.emitChange()),n.remove()};n.addEventListener("mousedown",r=>r.stopPropagation()),n.addEventListener("keydown",r=>{r.stopPropagation(),r.key==="Enter"&&a(),r.key==="Escape"&&(s=!0,n.remove())}),n.addEventListener("blur",a),document.body.appendChild(n),setTimeout(()=>n.focus(),0)}applyTransform(t,e){if(this.activeHandle==="move"){const u=e.x-this.lastDragPt.x,x=e.y-this.lastDragPt.y;this.lastDragPt=e,t.points?.forEach(m=>{m.x+=u,m.y+=x}),t.startPoint&&(t.startPoint.x+=u,t.startPoint.y+=x),t.endPoint&&(t.endPoint.x+=u,t.endPoint.y+=x),t.blurArea&&(t.blurArea.x+=u,t.blurArea.y+=x);return}if(!this.initialBBox||!this.initialAnnotationSnapshot)return;const i=this.initialBBox,o=this.initialAnnotationSnapshot;if(this.activeHandle==="rotate"){const u=i.x+i.w/2,x=i.y+i.h/2;t.rotation=Math.atan2(e.y-x,e.x-u)+Math.PI/2;return}const n=this.toLocalPt(e,i,t.rotation||0);let s=i.x,a=i.y,r=i.x+i.w,l=i.y+i.h;const d=this.activeHandle;d.includes("l")&&(s=Math.min(r-12,n.x)),d.includes("r")&&(r=Math.max(s+12,n.x)),d.includes("t")&&(a=Math.min(l-12,n.y)),d.includes("b")&&(l=Math.max(a+12,n.y));const g=r-s,y=l-a,p=g/Math.max(1,i.w),h=y/Math.max(1,i.h);if(o.points&&t.points)t.points=o.points.map(u=>({x:s+(u.x-i.x)*p,y:a+(u.y-i.y)*h}));else if(t.type==="text"&&o.startPoint){const u=Math.max(12,y-6);t.strokeWidth=Math.max(1,Math.min(24,Math.round((u-6)/4))),t.startPoint={x:s,y:a+u}}else if(o.startPoint&&o.endPoint){if(t.startPoint={x:s+(o.startPoint.x-i.x)*p,y:a+(o.startPoint.y-i.y)*h},t.endPoint={x:s+(o.endPoint.x-i.x)*p,y:a+(o.endPoint.y-i.y)*h},t.type==="ruler"){const u=Math.round(Math.hypot(t.endPoint.x-t.startPoint.x,t.endPoint.y-t.startPoint.y));t.text=`${u}px`}t.type==="blur"&&(t.blurArea={x:s,y:a,width:g,height:y})}}onMouseMove(t){const e=this.getPoint(t);if(this.activeHandle&&this.selectedId){const i=this.annotations.find(o=>o.id===this.selectedId);i&&(this.applyTransform(i,e),this.redraw());return}if(this.currentTool==="eraser"&&!this.isDrawing){const i=this.findAnnotationAt(e),o=i?i.id:null;o!==this.hoveredEraseId&&(this.hoveredEraseId=o,this.redraw());return}if(this.currentTool==="select"&&!this.isDrawing){if(this.selectedId){const o=this.annotations.find(n=>n.id===this.selectedId);if(o){const n=this.hitTestHandles(e,o);if(n){this.canvas.style.cursor=this.getHandleCursor(n);return}}}const i=this.findAnnotationAt(e);this.canvas.style.cursor=i?"grab":"default";return}if(!(!this.isDrawing||!this.currentAnnotation)){if(this.currentAnnotation.type==="pen"&&this.currentAnnotation.points)this.currentAnnotation.points.push(e);else if(this.currentAnnotation.endPoint=e,this.currentAnnotation.type==="ruler"&&this.currentAnnotation.startPoint){const i=e.x-this.currentAnnotation.startPoint.x,o=e.y-this.currentAnnotation.startPoint.y;this.currentAnnotation.text=`${Math.round(Math.hypot(i,o))}px`}this.redraw(),this.drawAnnotation(this.currentAnnotation)}}onMouseUp(){if(this.activeHandle){this.activeHandle=null,this.initialBBox=null,this.initialAnnotationSnapshot=null,this.canvas.style.cursor=this.currentTool==="select"?"default":"text",this.redraw(),this.emitChange();return}if(this.isDrawing&&(this.isDrawing=!1,this.currentAnnotation)){const t=this.currentAnnotation.startPoint,e=this.currentAnnotation.endPoint,i=t&&e&&Math.hypot(e.x-t.x,e.y-t.y)<4,o=this.currentAnnotation.type==="pen"&&(!this.currentAnnotation.points||this.currentAnnotation.points.length<2);if(i||o){this.currentAnnotation=null,this.redraw();return}this.currentAnnotation.type==="blur"&&t&&e&&(this.currentAnnotation.blurArea={x:Math.min(t.x,e.x),y:Math.min(t.y,e.y),width:Math.abs(e.x-t.x),height:Math.abs(e.y-t.y)}),this.pushHistory(),this.annotations.push(this.currentAnnotation),this.currentAnnotation=null,this.redraw(),this.emitChange()}}redraw(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);for(const t of this.annotations)if(t.type!=="sticky"){if(this.drawAnnotation(t),t.id===this.hoveredEraseId){const e=this.getAnnotationBBox(t);e&&(this.ctx.save(),this.ctx.strokeStyle="#ef4444",this.ctx.lineWidth=1.5,this.ctx.setLineDash([4,3]),this.ctx.strokeRect(e.x-4,e.y-4,e.w+8,e.h+8),this.ctx.restore())}t.id===this.selectedId&&this.currentTool==="select"&&this.drawTransformControls(t)}this.renderStickyOverlay()}renderStickyOverlay(t){const e=this.stickyShadow.getElementById("sn-container");if(e){e.innerHTML="";for(const i of this.annotations){if(i.type!=="sticky"||!i.startPoint)continue;const o=Y(i.stickyTheme),n=i.endPoint?Math.max(150,i.endPoint.x-i.startPoint.x):210,s=i.endPoint?Math.max(96,i.endPoint.y-i.startPoint.y):120,a=document.createElement("div");a.className="sn-card",this.mode==="contained"?(a.style.left=`${i.startPoint.x/Math.max(1,this.canvas.width)*100}%`,a.style.top=`${i.startPoint.y/Math.max(1,this.canvas.height)*100}%`):(a.style.left=`${i.startPoint.x}px`,a.style.top=`${i.startPoint.y}px`),a.style.width=`${n}px`,a.style.minHeight=`${s}px`,a.style.background=o.bg,a.style.borderColor=o.border,a.style.color=o.text;const r=document.createElement("div");r.className="sn-head",r.style.background=o.headerBg,r.innerHTML=`
        <span class="sn-dots">⋮⋮</span>
        <div class="sn-actions">
          <button class="sn-icon-btn" data-sn-theme="${i.id}" title="Ganti Tema (${o.label})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          </button>
          <button class="sn-icon-btn" data-sn-del="${i.id}" title="Hapus Note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      `;const l=document.createElement("textarea");l.className="sn-body",l.placeholder="Tulis catatan...",l.value=i.text||"",l.addEventListener("input",()=>{i.text=l.value,this.emitChange()}),r.addEventListener("mousedown",d=>{if(d.target.closest("button"))return;d.preventDefault();const g=d.clientX,y=d.clientY,p=i.startPoint.x,h=i.startPoint.y,u=this.canvas.getBoundingClientRect(),x=this.mode==="contained"?this.canvas.width/Math.max(1,u.width):1,m=this.mode==="contained"?this.canvas.height/Math.max(1,u.height):1,b=this.mode==="contained"?this.canvas.width-40:window.innerWidth-40,v=this.mode==="contained"?this.canvas.height-40:window.innerHeight-40,w=$=>{const E=Math.max(0,Math.min(b,p+($.clientX-g)*x)),T=Math.max(0,Math.min(v,h+($.clientY-y)*m));i.startPoint={x:E,y:T},i.endPoint={x:E+n,y:T+s},this.mode==="contained"?(a.style.left=`${E/Math.max(1,this.canvas.width)*100}%`,a.style.top=`${T/Math.max(1,this.canvas.height)*100}%`):(a.style.left=`${E}px`,a.style.top=`${T}px`)},M=()=>{window.removeEventListener("mousemove",w),window.removeEventListener("mouseup",M),this.emitChange()};window.addEventListener("mousemove",w),window.addEventListener("mouseup",M)}),r.querySelector(`[data-sn-theme="${i.id}"]`)?.addEventListener("click",d=>{d.stopPropagation(),this.pushHistory(),i.stickyTheme=et(i.stickyTheme),this.renderStickyOverlay(),this.emitChange()}),r.querySelector(`[data-sn-del="${i.id}"]`)?.addEventListener("click",d=>{d.stopPropagation(),this.pushHistory(),this.annotations=this.annotations.filter(g=>g.id!==i.id),this.renderStickyOverlay(),this.emitChange()}),a.appendChild(r),a.appendChild(l),e.appendChild(a),t===i.id&&setTimeout(()=>l.focus(),0)}}}drawTransformControls(t){const e=this.getAnnotationBBox(t);if(!e)return;const i=this.ctx;if(i.save(),t.rotation){const n=e.x+e.w/2,s=e.y+e.h/2;i.translate(n,s),i.rotate(t.rotation),i.translate(-n,-s)}i.strokeStyle="#38bdf8",i.lineWidth=1.5,i.strokeRect(e.x,e.y,e.w,e.h);const o=this.getHandlePositions(e);i.beginPath(),i.moveTo(o.t.x,o.t.y),i.lineTo(o.rotate.x,o.rotate.y),i.stroke(),["tl","t","tr","r","br","b","bl","l"].forEach(n=>{const s=o[n];i.fillStyle="#ffffff",i.strokeStyle="#050505",i.lineWidth=1.5,i.fillRect(s.x-4,s.y-4,8,8),i.strokeRect(s.x-4,s.y-4,8,8)}),i.fillStyle="#38bdf8",i.strokeStyle="#050505",i.beginPath(),i.arc(o.rotate.x,o.rotate.y,5,0,Math.PI*2),i.fill(),i.stroke(),i.restore()}drawAnnotation(t){const e=this.ctx,i=t.color||"#ffffff",o=t.strokeWidth||2,n=this.getAnnotationBBox(t);if(e.save(),t.rotation&&n){const s=n.x+n.w/2,a=n.y+n.h/2;e.translate(s,a),e.rotate(t.rotation),e.translate(-s,-a)}if(t.type==="pen"&&t.points&&t.points.length>1){e.strokeStyle=i,e.lineWidth=o,e.lineCap="round",e.lineJoin="round",e.beginPath(),e.moveTo(t.points[0].x,t.points[0].y);for(let s=1;s<t.points.length;s++)e.lineTo(t.points[s].x,t.points[s].y);e.stroke()}else if(t.type==="arrow"&&t.startPoint&&t.endPoint)this.drawArrow(t.startPoint,t.endPoint,i,o);else if(t.type==="line"&&t.startPoint&&t.endPoint)e.strokeStyle=i,e.lineWidth=o,e.lineCap="round",e.beginPath(),e.moveTo(t.startPoint.x,t.startPoint.y),e.lineTo(t.endPoint.x,t.endPoint.y),e.stroke();else if(it.has(t.type)&&t.startPoint&&t.endPoint){const s=Math.min(t.startPoint.x,t.endPoint.x),a=Math.min(t.startPoint.y,t.endPoint.y),r=Math.abs(t.endPoint.x-t.startPoint.x),l=Math.abs(t.endPoint.y-t.startPoint.y);e.strokeStyle=i,e.lineWidth=o,t.type==="box"?(e.setLineDash([6,4]),e.strokeRect(s,a,r,l)):t.type==="rounded-box"?(e.beginPath(),e.roundRect(s,a,r,l,Math.min(14,Math.min(r,l)/4)),e.stroke()):t.type==="circle"?(e.beginPath(),e.ellipse(s+r/2,a+l/2,Math.max(1,r/2),Math.max(1,l/2),0,0,Math.PI*2),e.stroke()):t.type==="diamond"?(e.beginPath(),e.moveTo(s+r/2,a),e.lineTo(s+r,a+l/2),e.lineTo(s+r/2,a+l),e.lineTo(s,a+l/2),e.closePath(),e.stroke()):t.type==="triangle"?(e.beginPath(),e.moveTo(s+r/2,a),e.lineTo(s+r,a+l),e.lineTo(s,a+l),e.closePath(),e.stroke()):t.type==="callout"&&(e.beginPath(),e.roundRect(s,a,r,l,Math.min(r,l)/2),e.stroke())}else if(t.type==="ruler"&&t.startPoint&&t.endPoint)this.drawRuler(t.startPoint,t.endPoint,t.text||"",i,o);else if(t.type==="text"&&t.startPoint&&t.text){const s=Math.max(13,o*4+6),a=t.fontFamily||this.currentFontFamily;e.font=`700 ${s}px ${a}`,e.shadowColor="rgba(0, 0, 0, 0.85)",e.shadowBlur=4,e.fillStyle=i,e.fillText(t.text,t.startPoint.x,t.startPoint.y)}else if(t.type==="blur"&&t.startPoint&&t.endPoint){const s=Math.min(t.startPoint.x,t.endPoint.x),a=Math.min(t.startPoint.y,t.endPoint.y),r=Math.abs(t.endPoint.x-t.startPoint.x),l=Math.abs(t.endPoint.y-t.startPoint.y),d=10,g=["#18181b","#27272a","#09090b","#3f3f46","#1f1f23"];e.save(),e.beginPath(),e.rect(s,a,r,l),e.clip();for(let y=a;y<a+l;y+=d)for(let p=s;p<s+r;p+=d){const h=Math.abs(Math.floor(p/d)*7+Math.floor(y/d)*13)%g.length;e.fillStyle=g[h],e.fillRect(p,y,d,d)}if(e.restore(),e.strokeStyle="#52525b",e.lineWidth=1,e.strokeRect(s,a,r,l),r>=48&&l>=22){const y=s+r/2,p=a+l/2;e.fillStyle="rgba(5, 5, 5, 0.88)",e.strokeStyle="#ffffff",e.lineWidth=1,e.beginPath(),e.roundRect(y-44,p-11,88,22,4),e.fill(),e.stroke(),e.strokeStyle="#ffffff",e.lineWidth=1.3,e.strokeRect(y-36,p-3,8,7),e.beginPath(),e.arc(y-32,p-3,3,Math.PI,0),e.stroke(),e.fillStyle="#ffffff",e.font="bold 9px ui-monospace, monospace",e.fillText("CENSORED",y-23,p+3)}}e.restore()}drawArrow(t,e,i,o){const n=this.ctx,s=Math.max(12,o*4),a=Math.atan2(e.y-t.y,e.x-t.x);n.strokeStyle=i,n.fillStyle=i,n.lineWidth=o,n.lineCap="round",n.beginPath(),n.moveTo(t.x,t.y),n.lineTo(e.x,e.y),n.stroke(),n.beginPath(),n.moveTo(e.x,e.y),n.lineTo(e.x-s*Math.cos(a-Math.PI/6),e.y-s*Math.sin(a-Math.PI/6)),n.lineTo(e.x-s*Math.cos(a+Math.PI/6),e.y-s*Math.sin(a+Math.PI/6)),n.closePath(),n.fill()}drawRuler(t,e,i,o,n){const s=this.ctx;s.strokeStyle=o,s.lineWidth=n,s.setLineDash([4,2]),s.beginPath(),s.moveTo(t.x,t.y),s.lineTo(e.x,e.y),s.stroke(),s.setLineDash([]);const a=Math.atan2(e.y-t.y,e.x-t.x),r=8,l=d=>{s.beginPath(),s.moveTo(d.x+r*Math.cos(a+Math.PI/2),d.y+r*Math.sin(a+Math.PI/2)),s.lineTo(d.x-r*Math.cos(a+Math.PI/2),d.y-r*Math.sin(a+Math.PI/2)),s.stroke()};if(l(t),l(e),i){const d=(t.x+e.x)/2,g=(t.y+e.y)/2;s.font="bold 11px monospace";const y=s.measureText(i);s.fillStyle="#050505",s.strokeStyle=o,s.lineWidth=1,s.beginPath(),s.roundRect(d-y.width/2-6,g-11,y.width+12,20,4),s.fill(),s.stroke(),s.fillStyle=o,s.fillText(i,d-y.width/2,g+3)}}renderToContext(t,e=0,i=0){t.drawImage(this.canvas,e,i);const o=this.canvas.getBoundingClientRect(),n=this.mode==="contained"&&o.width>0?this.canvas.width/o.width:1;for(const s of this.annotations)if(s.type==="sticky"&&s.startPoint){const a=s.endPoint?Math.max(150,s.endPoint.x-s.startPoint.x):210,r=s.endPoint?Math.max(96,s.endPoint.y-s.startPoint.y):120;q(t,{x:e+s.startPoint.x,y:i+s.startPoint.y,width:a*n,height:r*n,text:s.text||"",theme:s.stickyTheme,scale:n})}}async exportAnnotatedScreenshot(t,e){const i=document.createElement("canvas");i.width=this.canvas.width,i.height=this.canvas.height;const o=i.getContext("2d"),n=new Image;n.crossOrigin="anonymous",await new Promise((s,a)=>{n.onload=s,n.onerror=a,n.src=t}),o.drawImage(n,0,0,i.width,i.height),o.drawImage(this.canvas,0,0);for(const s of this.annotations)if(s.type==="sticky"&&s.startPoint){const a=s.endPoint?Math.max(150,s.endPoint.x-s.startPoint.x):210,r=s.endPoint?Math.max(96,s.endPoint.y-s.startPoint.y):120;q(o,{x:s.startPoint.x,y:s.startPoint.y,width:a,height:r,text:s.text||"",theme:s.stickyTheme,scale:1})}if(e&&e.width>0&&e.height>0){const a=Math.max(0,e.x-40),r=Math.max(0,e.y-40),l=Math.min(i.width-a,e.width+80),d=Math.min(i.height-r,e.height+80),g=document.createElement("canvas");return g.width=l,g.height=d,g.getContext("2d").drawImage(i,a,r,l,d,0,0,l,d),g.toDataURL("image/png")}return i.toDataURL("image/png")}destroy(){this.canvas.remove(),this.stickyHost.remove(),document.getElementById("letme-inline-text-input")?.remove()}}const G={settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',crosshair:'<circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/>',"mouse-pointer-click":'<path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/>',crop:'<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',maximize:'<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',bot:'<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',sparkles:'<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M18 4l.5 1.5a1 1 0 0 0 .7.7L21 6.5l-1.8.5a1 1 0 0 0-.7.7L18 9l-.5-1.3a1 1 0 0 0-.7-.7L15 6.5l1.8-.5a1 1 0 0 0 .7-.7Z"/>',"refresh-cw":'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',"arrow-left":'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',minus:'<path d="M5 12h14"/>',pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',"arrow-right":'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',square:'<rect width="18" height="18" x="3" y="3" rx="2"/>',type:'<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',ruler:'<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',"eye-off":'<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .698 10.793 10.793 0 0 1-3.14 4.248"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499A10.75 10.75 0 0 1 2.062 12.35a1 1 0 0 1 0-.698 10.75 10.75 0 0 1 2.876-3.877"/><line x1="2" x2="22" y1="2" y2="22"/>',"undo-2":'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',"trash-2":'<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',copy:'<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',check:'<polyline points="20 6 9 17 4 12"/>',"check-circle-2":'<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>',"alert-triangle":'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',"alert-circle":'<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',"external-link":'<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',"chevron-down":'<path d="m6 9 6 6 6-6"/>',"chevron-up":'<path d="m18 15-6-6-6 6"/>',radar:'<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',"locate-fixed":'<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>'};function f(c,t={}){const e=t.size||16,i=t.strokeWidth||2,o=t.color||"currentColor",n=t.className?` class="${t.className}"`:"",s=t.style?` style="${t.style}"`:"",a=G[c]||G.info;return`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="${o}" stroke-width="${i}" stroke-linecap="round" stroke-linejoin="round"${n}${s}>${a}</svg>`}class ot{overlay=null;selectionBox=null;isSelecting=!1;startX=0;startY=0;currentX=0;currentY=0;areaResolver=null;selectAreaOnly(){return new Promise(t=>{this.areaResolver=t,this.startAreaCapture()})}startAreaCapture(){this.cleanup(),this.overlay=document.createElement("div"),this.overlay.id="letme-screenshot-overlay",this.overlay.style.position="fixed",this.overlay.style.top="0",this.overlay.style.left="0",this.overlay.style.width="100vw",this.overlay.style.height="100vh",this.overlay.style.backgroundColor="rgba(0, 0, 0, 0.4)",this.overlay.style.zIndex="2147483646",this.overlay.style.cursor="crosshair",this.overlay.style.userSelect="none",this.selectionBox=document.createElement("div"),this.selectionBox.style.position="fixed",this.selectionBox.style.border="2px dashed #ffffff",this.selectionBox.style.backgroundColor="rgba(255, 255, 255, 0.08)",this.selectionBox.style.boxShadow="0 0 0 9999px rgba(0, 0, 0, 0.45)",this.selectionBox.style.display="none",this.selectionBox.style.pointerEvents="none",this.selectionBox.style.zIndex="2147483647";const t=document.createElement("div");t.id="letme-crop-tip",t.style.position="fixed",t.style.top="20px",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.backgroundColor="#09090b",t.style.border="1px solid #27272a",t.style.color="#fafafa",t.style.padding="8px 16px",t.style.borderRadius="9999px",t.style.fontSize="12px",t.style.fontFamily="monospace",t.style.fontWeight="600",t.innerText="Drag to select screenshot area (ESC to cancel)",this.overlay.appendChild(t),document.body.appendChild(this.selectionBox),document.body.appendChild(this.overlay),this.overlay.addEventListener("mousedown",this.onMouseDown),window.addEventListener("mousemove",this.onMouseMove),window.addEventListener("mouseup",this.onMouseUp),window.addEventListener("keydown",this.onKeyDown)}onMouseDown=t=>{t.button===0&&(this.isSelecting=!0,this.startX=t.clientX,this.startY=t.clientY,this.currentX=t.clientX,this.currentY=t.clientY,this.selectionBox&&(this.selectionBox.style.display="block",this.updateSelectionBox()))};onMouseMove=t=>{this.isSelecting&&(this.currentX=t.clientX,this.currentY=t.clientY,this.updateSelectionBox())};updateSelectionBox(){if(!this.selectionBox)return;const t=Math.min(this.startX,this.currentX),e=Math.min(this.startY,this.currentY),i=Math.abs(this.currentX-this.startX),o=Math.abs(this.currentY-this.startY);this.selectionBox.style.left=`${t}px`,this.selectionBox.style.top=`${e}px`,this.selectionBox.style.width=`${i}px`,this.selectionBox.style.height=`${o}px`}onMouseUp=async()=>{if(!this.isSelecting)return;this.isSelecting=!1;const t=Math.min(this.startX,this.currentX),e=Math.min(this.startY,this.currentY),i=Math.abs(this.currentX-this.startX),o=Math.abs(this.currentY-this.startY);if(this.cleanup(),this.areaResolver){const n=this.areaResolver;this.areaResolver=null,n(i>=10&&o>=10?new DOMRect(t,e,i,o):null);return}i<10||o<10||await this.captureAndProcessCrop(t,e,i,o)};onKeyDown=t=>{if(t.key==="Escape"&&(this.cleanup(),this.areaResolver)){const e=this.areaResolver;this.areaResolver=null,e(null)}};async captureFullPage(){try{const e=(await chrome.runtime.sendMessage({type:"CAPTURE_TAB"}))?.dataUrl||"";if(!e)throw new Error("Could not capture viewport screenshot.");await this.showScreenshotResultDialog(e,"full-viewport.png")}catch(t){alert(`Screenshot failed: ${t.message}`)}}async captureAndProcessCrop(t,e,i,o){try{const s=(await chrome.runtime.sendMessage({type:"CAPTURE_TAB"}))?.dataUrl||"";if(!s)throw new Error("Could not capture tab.");const a=new Image;await new Promise((y,p)=>{a.onload=y,a.onerror=p,a.src=s});const r=window.devicePixelRatio||1,l=document.createElement("canvas");l.width=Math.round(i*r),l.height=Math.round(o*r),l.getContext("2d").drawImage(a,Math.round(t*r),Math.round(e*r),Math.round(i*r),Math.round(o*r),0,0,l.width,l.height);const g=l.toDataURL("image/png");l.toBlob(async y=>{if(y)try{await navigator.clipboard.write([new ClipboardItem({"image/png":y})])}catch(p){console.warn("[LetMe] Clipboard write image error:",p)}},"image/png"),await this.showScreenshotResultDialog(g,`screenshot-${Math.round(i)}x${Math.round(o)}.png`)}catch(n){alert(`Area crop error: ${n.message}`)}}async showScreenshotResultDialog(t,e){const i=document.createElement("div");i.id="letme-screenshot-modal",i.style.position="fixed",i.style.bottom="24px",i.style.right="24px",i.style.maxWidth="420px",i.style.backgroundColor="#09090b",i.style.border="1px solid #27272a",i.style.borderRadius="12px",i.style.padding="16px",i.style.boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.7)",i.style.zIndex="2147483647",i.style.fontFamily="system-ui, -apple-system, sans-serif",i.style.color="#fafafa",i.innerHTML=`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 700; font-size: 13px; color: #ffffff;">Screenshot Captured</span>
          <span style="font-size: 11px; padding: 2px 6px; background: #27272a; border-radius: 4px; color: #10b981; display: inline-flex; align-items: center; gap: 4px;">
            ${f("check",{size:11,color:"#10b981"})} Copied to Clipboard
          </span>
        </div>
        <button id="letme-btn-close-modal" style="background: none; border: none; color: #a1a1aa; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 2px 4px; border-radius: 4px;">${f("x",{size:14})}</button>
      </div>

      <div style="border: 1px solid #27272a; border-radius: 6px; overflow: hidden; margin-bottom: 12px; background: #18181b; max-height: 180px; display: flex; align-items: center; justify-content: center;">
        <img src="${t}" style="max-width: 100%; max-height: 180px; object-fit: contain; display: block;" />
      </div>

      <div style="display: flex; gap: 8px;">
        <button id="letme-btn-download" style="flex: 1; padding: 8px 12px; background: #18181b; border: 1px solid #27272a; color: #fafafa; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          ${f("download",{size:13})} Download PNG
        </button>
        <button id="letme-btn-send-mcp" style="flex: 1; padding: 8px 12px; background: #fafafa; border: 1px solid #ffffff; color: #09090b; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          ${f("zap",{size:13,color:"#09090b"})} Send to MCP
        </button>
      </div>
    `,document.body.appendChild(i),i.querySelector("#letme-btn-close-modal")?.addEventListener("click",()=>i.remove()),i.querySelector("#letme-btn-download")?.addEventListener("click",()=>{const o=document.createElement("a");o.href=t,o.download=e,o.click()}),i.querySelector("#letme-btn-send-mcp")?.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"ELEMENT_CAPTURED",payload:{id:`shot_${Date.now()}`,timestamp:Date.now(),url:window.location.href,pageTitle:document.title,selector:"viewport",tagName:"screenshot",classNames:[],outerHtmlSnippet:"<!-- Viewport Screenshot Area -->",boxModel:{width:window.innerWidth,height:window.innerHeight,margin:{top:0,right:0,bottom:0,left:0},border:{top:0,right:0,bottom:0,left:0},padding:{top:0,right:0,bottom:0,left:0},content:{width:window.innerWidth,height:window.innerHeight},boundingBox:{x:0,y:0,top:0,right:window.innerWidth,bottom:window.innerHeight,left:0,width:window.innerWidth,height:window.innerHeight}},layoutContext:{parentTagName:"body",parentSelector:"body",display:"block",position:"static",isFlexChild:!1,isGridChild:!1},layoutBugs:{hasHorizontalScrollLeak:!1,isClippedByAncestor:!1,hasZIndexConflict:!1,zIndex:"auto",warnings:[]},computedStyles:{},screenshotBase64:t,userInstructions:"Analisis visual dari screenshot yang ditangkap pengguna",annotations:[],viewport:{width:window.innerWidth,height:window.innerHeight,devicePixelRatio:window.devicePixelRatio||1}}});const o=i.querySelector("#letme-btn-send-mcp");o&&(o.innerHTML=`<span style="display:inline-flex; align-items:center; gap:4px;">${f("check",{size:12,color:"#09090b"})} Sent to AI via MCP!</span>`,o.disabled=!0),setTimeout(()=>i.remove(),2e3)})}cleanup(){this.overlay?.remove(),this.selectionBox?.remove(),this.overlay=null,this.selectionBox=null,this.isSelecting=!1,window.removeEventListener("mousemove",this.onMouseMove),window.removeEventListener("mouseup",this.onMouseUp),window.removeEventListener("keydown",this.onKeyDown)}}const A=new ot;class nt{host=null;shadow=null;baseImg=null;canvas=null;ctx=null;markup=null;activeTool="pen";activeColor="#ef4444";activeStroke=3;frameMode="none";zoomMode="fit";rightRailOpen=!0;includeCaptionInImage=!0;isSpacePanning=!1;keydownHandler=null;keyupHandler=null;open(t,e){this.close(),this.frameMode=t.frame,this.zoomMode="fit",this.rightRailOpen=!0,this.includeCaptionInImage=!0,this.activeTool="pen",this.host=document.createElement("div"),this.host.id="letme-scr-editor-root",this.shadow=this.host.attachShadow({mode:"open"}),document.body.appendChild(this.host);const i=["#ef4444","#ffffff","#22c55e","#3b82f6"];this.shadow.innerHTML=`
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .backdrop {
          position: fixed; inset: 0; z-index: 2147483647;
          background: #050505; display: flex;
        }
        .modal {
          width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh;
          background: #08080a; display: flex; flex-direction: column; overflow: hidden; color: #fafafa;
        }
        .head {
          height: 48px; flex-shrink: 0; padding: 0 14px;
          background: #050505; border-bottom: 1px solid #27272a;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .head-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .brand-dot { width: 8px; height: 8px; border-radius: 50%; background: #ffffff; flex-shrink: 0; }
        .title {
          font-size: 12px; font-weight: 700; color: #ffffff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .meta-pill {
          font-size: 10px; font-weight: 600; color: #a1a1aa;
          padding: 2px 7px; border-radius: 999px; border: 1px solid #27272a; background: #0a0a0c;
        }
        .head-center { display: flex; align-items: center; gap: 6px; }
        .head-right { display: flex; align-items: center; gap: 6px; }
        .workspace { flex: 1; min-height: 0; display: flex; overflow: hidden; }
        .tool-dock {
          width: 62px; flex-shrink: 0; padding: 8px 4px;
          background: #050505; border-right: 1px solid #27272a;
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          overflow-y: auto; overflow-x: hidden;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .tool-dock::-webkit-scrollbar,
        .stage::-webkit-scrollbar,
        .right-rail::-webkit-scrollbar {
          display: none; width: 0; height: 0;
        }
        .dock-btn {
          width: 48px; padding: 4px 2px; border-radius: 7px;
          border: 1px solid transparent; background: transparent;
          color: #a1a1aa; font-size: 9px; font-weight: 600; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          transition: all 0.12s ease; flex-shrink: 0;
        }
        .dock-btn:hover { background: #141418; color: #ffffff; border-color: #2e2e32; }
        .dock-btn.active { background: #ffffff; color: #000000; border-color: #ffffff; }
        .dock-sep { width: 34px; height: 1px; background: #27272a; margin: 3px 0; flex-shrink: 0; }
        .swatch-grid { display: grid; grid-template-columns: repeat(2, 16px); gap: 4px; }
        .swatch {
          width: 16px; height: 16px; border-radius: 50%; border: 1px solid #3f3f46;
          cursor: pointer; padding: 0;
        }
        .swatch.active { outline: 2px solid #ffffff; outline-offset: 1px; }
        .t-btn {
          padding: 6px 10px; border-radius: 6px; border: 1px solid #2e2e32; background: #0a0a0c;
          color: #d4d4d8; font-size: 11px; font-weight: 600; cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
        }
        .t-btn:hover { border-color: #ffffff; color: #ffffff; }
        .t-btn.active { background: #ffffff; color: #000000; border-color: #ffffff; }
        .stage {
          flex: 1; min-width: 0; min-height: 0; overflow: auto; padding: 24px;
          display: flex; align-items: center; justify-content: center;
          background-color: #070709;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 16px 16px;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .stage.panning, .stage.panning * { cursor: grab !important; }
        .stage.panning.dragging, .stage.panning.dragging * { cursor: grabbing !important; }
        .stage.actual { align-items: flex-start; justify-content: flex-start; }
        .canvas-wrap { position: relative; display: inline-block; line-height: 0; }
        canvas#ed-canvas {
          border-radius: 6px; border: 1px solid #3f3f46; display: block;
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.7);
        }
        .stage.fit canvas#ed-canvas {
          max-width: 100%; max-height: calc(100vh - 96px); width: auto; height: auto;
        }
        .stage.actual canvas#ed-canvas { max-width: none; max-height: none; }
        .right-rail {
          width: 280px; flex-shrink: 0; padding: 14px;
          background: #050505; border-left: 1px solid #27272a;
          display: flex; flex-direction: column; gap: 16px;
          overflow-y: auto; overflow-x: hidden;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .right-rail.hidden { display: none; }
        .rail-sec { display: flex; flex-direction: column; gap: 8px; }
        .rail-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #71717a;
        }
        .seg-group { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .caption-area {
          width: 100%; min-height: 140px; resize: vertical;
          background: #0a0a0c; border: 1px solid #2e2e32; border-radius: 7px;
          color: #fafafa; padding: 9px 10px; font-size: 12px; line-height: 1.45; outline: none;
        }
        .caption-area:focus { border-color: #ffffff; }
        .hint-box {
          margin-top: auto; padding: 10px; border-radius: 7px;
          border: 1px dashed #27272a; background: #0a0a0c;
          font-size: 10px; color: #71717a; line-height: 1.6;
        }
        .kbd {
          padding: 1px 5px; border-radius: 4px; border: 1px solid #3f3f46;
          background: #141418; color: #e4e4e7; font-size: 9px; font-weight: 600;
        }
        .btn-pri {
          padding: 6px 12px; background: #ffffff; border: 1px solid #ffffff; border-radius: 6px;
          color: #000000; font-size: 11px; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
        }
        .btn-pri:hover { background: #e4e4e7; }
      </style>
      <div class="backdrop">
        <div class="modal">
          <div class="head">
            <div class="head-left">
              <span class="brand-dot"></span>
              <span class="title">Edit ${t.name}</span>
              <span class="meta-pill">${t.width}×${t.height}px</span>
            </div>
            <div class="head-center">
              <button id="ed-undo" class="t-btn" title="Undo (Ctrl+Z)">${f("undo-2",{size:12})} Undo</button>
              <button id="ed-redo" class="t-btn" title="Redo (Ctrl+Y)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg> Redo</button>
              <button id="ed-clear" class="t-btn" title="Clear Markups">${f("trash-2",{size:12})} Clear</button>
              <button id="ed-zoom" class="t-btn" title="Toggle Fit / 100%">Zoom: Fit</button>
              <button id="ed-toggle-rail" class="t-btn active" title="Toggle Notes & Frame Panel">Inspector</button>
            </div>
            <div class="head-right">
              <button id="ed-copy" class="t-btn">${f("copy",{size:12})} Copy</button>
              <button id="ed-download" class="t-btn">${f("download",{size:12})} Save File</button>
              <button id="ed-send" class="t-btn">${f("zap",{size:12})} Send MCP</button>
              <button id="ed-save" class="btn-pri">Save Changes</button>
              <button id="ed-close" class="t-btn" title="Close (Esc)">×</button>
            </div>
          </div>
          <div class="workspace">
            <div class="tool-dock">
              <button class="dock-btn" data-ed-tool="select"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg><span>Move</span></button>
              <button class="dock-btn active" data-ed-tool="pen">${f("pencil",{size:15})}<span>Draw</span></button>
              <button class="dock-btn" data-ed-tool="arrow">${f("arrow-right",{size:15})}<span>Arrow</span></button>
              <button class="dock-btn" data-ed-tool="line">${f("minus",{size:15})}<span>Line</span></button>
              <button class="dock-btn" data-ed-tool="ruler">${f("ruler",{size:15})}<span>Ruler</span></button>
              <button class="dock-btn" data-ed-tool="box">${f("square",{size:15})}<span>Box</span></button>
              <button class="dock-btn" data-ed-tool="circle"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg><span>Circle</span></button>
              <button class="dock-btn" data-ed-tool="text">${f("type",{size:15})}<span>Text</span></button>
              <button class="dock-btn" data-ed-tool="sticky"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg><span>Note</span></button>
              <button class="dock-btn" data-ed-tool="blur">${f("eye-off",{size:15})}<span>Censor</span></button>
              <button class="dock-btn" data-ed-tool="eraser"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg><span>Eraser</span></button>
              <div class="dock-sep"></div>
              <input id="ed-color" type="color" value="${this.activeColor}" style="width:28px;height:28px;border:1px solid #3f3f46;background:none;cursor:pointer;border-radius:50%;" title="Custom Color" />
              <div class="swatch-grid">
                ${i.map(s=>`<button class="swatch ${s===this.activeColor?"active":""}" data-ed-swatch="${s}" style="background:${s};" title="${s}"></button>`).join("")}
              </div>
              <button id="ed-px" class="dock-btn" style="margin-top:4px;border:1px solid #2e2e32;"><span>${this.activeStroke}px</span></button>
            </div>
            <div id="ed-stage" class="stage fit">
              <div id="ed-canvas-wrap" class="canvas-wrap">
                <canvas id="ed-canvas"></canvas>
              </div>
            </div>
            <div id="ed-rail" class="right-rail">
              <div class="rail-sec">
                <div class="rail-label">Export Frame</div>
                <div class="seg-group">
                  <button id="ed-frame-none" class="t-btn ${this.frameMode==="none"?"active":""}" style="justify-content:center;">None</button>
                  <button id="ed-frame-bp" class="t-btn ${this.frameMode==="blueprint"?"active":""}" style="justify-content:center;">Blueprint</button>
                </div>
              </div>
              <div class="rail-sec" style="flex:1;">
                <div class="rail-label">Caption / AI Instructions</div>
                <textarea id="ed-caption" class="caption-area" placeholder="Tambahkan catatan, konteks bug, atau instruksi perbaikan untuk screenshot ini...">${t.caption.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</textarea>
                <button id="ed-caption-burn" class="t-btn active" style="justify-content:center;font-size:10px;" title="Sertakan teks caption di bagian bawah gambar saat Copy / Export">Include Caption in Image: ON</button>
              </div>
              <div class="hint-box">
                <div><span class="kbd">Space + Drag</span> Geser kanvas</div>
                <div><span class="kbd">Ctrl/⌘ + Z</span> Undo coretan terakhir</div>
                <div><span class="kbd">Ctrl/⌘ + Y</span> Redo coretan</div>
                <div><span class="kbd">Esc</span> Tutup editor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,this.canvas=this.shadow.getElementById("ed-canvas"),this.ctx=this.canvas.getContext("2d");const o=this.shadow.getElementById("ed-canvas-wrap"),n=new Image;n.onload=()=>{this.baseImg=n,this.canvas&&this.ctx&&o&&(this.canvas.width=n.width,this.canvas.height=n.height,this.ctx.drawImage(n,0,0),this.markup=new X(n.width,n.height,{mode:"contained",container:o}),this.markup.setTool(this.activeTool),this.markup.setColor(this.activeColor),this.markup.setStrokeWidth(this.activeStroke),t.annotations?.length&&this.markup.setAnnotations(t.annotations))},n.src=t.originalDataUrl,this.bindEditorEvents(t,e)}bindEditorEvents(t,e){if(!this.shadow)return;this.shadow.getElementById("ed-close")?.addEventListener("click",()=>this.close()),this.shadow.querySelectorAll("[data-ed-tool]").forEach(m=>{m.addEventListener("click",()=>{this.activeTool=m.dataset.edTool,this.markup?.setTool(this.activeTool),this.shadow?.querySelectorAll("[data-ed-tool]").forEach(b=>b.classList.remove("active")),m.classList.add("active")})});const i=this.shadow.getElementById("ed-caption-burn");i?.addEventListener("click",()=>{this.includeCaptionInImage=!this.includeCaptionInImage,i.classList.toggle("active",this.includeCaptionInImage),i.textContent=`Include Caption in Image: ${this.includeCaptionInImage?"ON":"OFF"}`});const o=this.shadow.getElementById("ed-color"),n=m=>{this.shadow?.querySelectorAll("[data-ed-swatch]").forEach(b=>{b.classList.toggle("active",b.dataset.edSwatch?.toLowerCase()===m.toLowerCase())})};o?.addEventListener("input",()=>{this.activeColor=o.value,this.markup?.setColor(this.activeColor),n(this.activeColor)}),this.shadow.querySelectorAll("[data-ed-swatch]").forEach(m=>{m.addEventListener("click",()=>{const b=m.dataset.edSwatch||"#ef4444";this.activeColor=b,this.markup?.setColor(b),o&&(o.value=b),n(b)})});const s=this.shadow.getElementById("ed-px");s?.addEventListener("click",()=>{this.activeStroke=this.activeStroke>=8?2:this.activeStroke+2,this.markup?.setStrokeWidth(this.activeStroke),s.innerHTML=`<span>${this.activeStroke}px</span>`});const a=this.shadow.getElementById("ed-frame-none"),r=this.shadow.getElementById("ed-frame-bp"),l=m=>{this.frameMode=m,a?.classList.toggle("active",m==="none"),r?.classList.toggle("active",m==="blueprint")};a?.addEventListener("click",()=>l("none")),r?.addEventListener("click",()=>l("blueprint"));const d=this.shadow.getElementById("ed-stage"),g=this.shadow.getElementById("ed-zoom");g?.addEventListener("click",()=>{this.zoomMode=this.zoomMode==="fit"?"actual":"fit",d?.classList.toggle("fit",this.zoomMode==="fit"),d?.classList.toggle("actual",this.zoomMode==="actual"),g.textContent=this.zoomMode==="fit"?"Zoom: Fit":"Zoom: 100%"});const y=this.shadow.getElementById("ed-rail"),p=this.shadow.getElementById("ed-toggle-rail");p?.addEventListener("click",()=>{this.rightRailOpen=!this.rightRailOpen,y?.classList.toggle("hidden",!this.rightRailOpen),p.classList.toggle("active",this.rightRailOpen)}),this.shadow.getElementById("ed-undo")?.addEventListener("click",()=>this.markup?.undo()),this.shadow.getElementById("ed-redo")?.addEventListener("click",()=>this.markup?.redo()),this.shadow.getElementById("ed-clear")?.addEventListener("click",()=>this.markup?.clear()),this.keydownHandler=m=>{if(document.getElementById("letme-inline-text-input"))return;if(m.key==="Escape"){m.preventDefault(),this.close();return}const b=this.shadow?.activeElement;if(!(b&&(b.tagName==="TEXTAREA"||b.tagName==="INPUT"))){if(m.code==="Space"&&!this.isSpacePanning){m.preventDefault(),this.isSpacePanning=!0,d?.classList.add("panning");return}(m.ctrlKey||m.metaKey)&&m.key.toLowerCase()==="z"?(m.preventDefault(),m.shiftKey?this.markup?.redo():this.markup?.undo()):(m.ctrlKey||m.metaKey)&&m.key.toLowerCase()==="y"&&(m.preventDefault(),this.markup?.redo())}},this.keyupHandler=m=>{m.code==="Space"&&this.isSpacePanning&&(this.isSpacePanning=!1,d?.classList.remove("panning","dragging"))},window.addEventListener("keydown",this.keydownHandler),window.addEventListener("keyup",this.keyupHandler),d?.addEventListener("mousedown",m=>{if(!this.isSpacePanning&&m.button!==1)return;m.preventDefault(),m.stopPropagation(),d.classList.add("panning","dragging");const b=m.clientX,v=m.clientY,w=d.scrollLeft,M=d.scrollTop,$=T=>{d.scrollLeft=w-(T.clientX-b),d.scrollTop=M-(T.clientY-v)},E=()=>{d.classList.remove("dragging"),this.isSpacePanning||d.classList.remove("panning"),window.removeEventListener("mousemove",$),window.removeEventListener("mouseup",E)};window.addEventListener("mousemove",$),window.addEventListener("mouseup",E)},!0);const h=()=>this.renderExportDataUrl(),u=()=>this.shadow?.getElementById("ed-caption")?.value||"",x=()=>this.markup?.getAnnotations()||[];this.shadow.getElementById("ed-copy")?.addEventListener("click",()=>{e.onCopyImage(h(),u(),this.frameMode,x())}),this.shadow.getElementById("ed-download")?.addEventListener("click",()=>{e.onDownload(h(),`${t.name.toLowerCase().replace(/\s+/g,"-")}.png`)}),this.shadow.getElementById("ed-send")?.addEventListener("click",()=>{e.onSendToAi(t,h(),u(),x()),this.close()}),this.shadow.getElementById("ed-save")?.addEventListener("click",()=>{e.onSave(t.id,h(),u(),this.frameMode,x()),this.close()})}renderExportDataUrl(){if(!this.canvas)return"";const t=this.frameMode==="blueprint"?24:0,e=(this.shadow?.getElementById("ed-caption")?.value||"").trim(),i=this.includeCaptionInImage&&e.length>0,o=this.canvas.width+t*2,n=this.canvas.height+t*2,a=document.createElement("canvas").getContext("2d"),r=Math.max(14,Math.round(o*.014)),l=Math.round(r*1.45),d=Math.max(16,t||18),g=12,y=[];if(i){a.font=`600 ${r}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;const x=Math.max(120,o-d*2);for(const m of e.split(`
`)){const b=m.split(" ");let v="";for(const w of b){const M=v?`${v} ${w}`:w;a.measureText(M).width>x&&v?(y.push(v),v=w):v=M}v&&y.push(v)}}const p=y.length>0?y.length*l+g*2:0,h=document.createElement("canvas");h.width=o,h.height=n+p;const u=h.getContext("2d");return this.frameMode==="blueprint"?(u.fillStyle="#050505",u.fillRect(0,0,h.width,h.height),u.strokeStyle="#3f3f46",u.lineWidth=2,u.strokeRect(t-2,t-2,this.canvas.width+4,this.canvas.height+4)):p>0&&(u.fillStyle="#09090b",u.fillRect(0,n,h.width,p)),u.drawImage(this.canvas,t,t),this.markup?.renderToContext(u,t,t),p>0&&(u.strokeStyle="#27272a",u.lineWidth=1,u.beginPath(),u.moveTo(0,n),u.lineTo(h.width,n),u.stroke(),u.font=`600 ${r}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,u.fillStyle="#fafafa",u.textBaseline="top",y.forEach((x,m)=>{u.fillText(x,d,n+g+m*l)})),h.toDataURL("image/png")}close(){this.keydownHandler&&(window.removeEventListener("keydown",this.keydownHandler),this.keydownHandler=null),this.keyupHandler&&(window.removeEventListener("keyup",this.keyupHandler),this.keyupHandler=null),this.isSpacePanning=!1,this.markup?.destroy(),this.markup=null,this.host?.remove(),this.host=null,this.shadow=null,this.canvas=null,this.ctx=null}}function st(c){let t=c.trim();return/^https?:\/\//i.test(t)||(t.startsWith("localhost")||t.startsWith("127.0.0.1")?t=`http://${t}`:t=`https://${t}`),t=t.replace(/\/+$/,""),t.endsWith("/chat/completions")?t:`${t}/chat/completions`}class at{activePins=[];isLoading=!1;currentBugs=[];currentScreenshot="";activeFilter="all";resolvedBoundsMap=new Map;scrollListenerAttached=!1;rAFScheduled=!1;async runDetection(){if(this.isLoading)return;const t=await chrome.storage.local.get(["aiBaseUrl","aiApiKey","aiModel","aiProvider"]),e=t.aiProvider||"openrouter",i=t.aiBaseUrl||(e==="gemini"?"https://generativelanguage.googleapis.com/v1beta/openai":"https://openrouter.ai/api/v1"),o=t.aiApiKey,n=t.aiModel||(e==="gemini"?"gemini-2.0-flash":"google/gemini-2.0-flash-001");if(!o&&e!=="ollama"){this.showModalAlert("AI Configuration Required",`AI Vision Auto Bug Detection requires an API Key.

Please open the LetMe extension popup > Settings to select your AI provider (e.g. Google Gemini, OpenRouter, OpenAI, Groq) and enter your API Key.`);return}if(i.includes(":28120")&&!i.includes("/v1")){this.showModalAlert("Invalid AI Vision Base URL",`Base URL "${i}" points to your local web dashboard (Alpakyros) instead of an AI Vision LLM endpoint.

How to fix:
1. Click the LetMe extension icon
2. Click Settings
3. Select an AI Provider (e.g. Google Gemini or OpenRouter)
4. Paste your API Key and click "Save Settings".`);return}this.clearPins(),this.showScanningHUD("Initializing AI Vision Scanner...");try{this.updateScanningStage("Capturing High-Res Viewport Snapshot...");const s=document.getElementById("letme-scanner-hud");s&&(s.style.display="none"),await new Promise(v=>requestAnimationFrame(()=>setTimeout(v,60)));const a=await chrome.runtime.sendMessage({type:"CAPTURE_TAB"});s&&(s.style.display="block");const r=a?.dataUrl||"";if(!r)throw new Error("Could not capture viewport for AI vision analysis.");const l=await this.rescaleImageToViewport(r,window.innerWidth,window.innerHeight);this.currentScreenshot=l;const d=st(i);this.updateScanningStage(`AI Vision (${n}) Analyzing Layout & Alignment...`);const g=`You are an elite Frontend UI/UX and QA Engineer. Analyze the screenshot of this webpage (${window.innerWidth}px wide by ${window.innerHeight}px high) to spot visual bugs, layout leaks, broken flex/grid wrapping, text clipping/overflow, unreadable contrast, stray elements, or misaligned elements.

For every issue found, provide:
1. "x" and "y": The exact pixel coordinates (from left and top) within the ${window.innerWidth}x${window.innerHeight} viewport.
2. "width" and "height": The approximate pixel dimensions of the affected element or area.
3. "target_text": CRITICAL! Any distinct visible text, headline, or button label inside or directly next to the affected element (e.g. "ONLINE PUBLISHER", "PUBLISH YOUR AI MODE", "LOGIN", "Total revenue"). If it is an icon, badge, or image, state its label or surrounding text. This is used to locate the exact DOM element.
4. "title": Short, crisp title of the bug.
5. "description": Concise explanation of the problem.
6. "severity": "critical" | "warning" | "suggestion".
7. "fix": Concrete CSS or layout recommendation to fix it.

Return ONLY a valid JSON array of objects matching this exact structure:
Array<{
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  target_text?: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "suggestion";
  fix: string;
}>`,y={"Content-Type":"application/json"};o&&(y.Authorization=`Bearer ${o}`);const p=await chrome.runtime.sendMessage({type:"PROXY_AI_REQUEST",payload:{endpoint:d,headers:y,body:{model:n,messages:[{role:"system",content:g},{role:"user",content:[{type:"text",text:`Analyze this webpage (${window.innerWidth}px x ${window.innerHeight}px). Page title: "${document.title}". Spot visual bugs, alignment issues, layout overflow, or clipping. Return ONLY JSON array.`},{type:"image_url",image_url:{url:l}}]}],temperature:.2}}});if(!p)throw new Error("Background proxy service is unavailable. Please reload the extension.");const h=p.text||"";if(!p.ok)throw p.error?new Error(`Connection error: ${p.error}`):p.status===405?new Error(`Endpoint returned HTTP 405 (Method Not Allowed).

"${d}" does not support POST /chat/completions.

Please configure a valid AI Vision provider (e.g. Google Gemini, OpenRouter, OpenAI, Groq, or Ollama) in LetMe Settings.`):p.status===404?new Error(`Endpoint returned HTTP 404 (Not Found) at "${d}".

Please verify your AI Base URL in LetMe Settings.`):p.status===401||p.status===403?new Error(`Authentication failed (HTTP ${p.status}).

Your API Key appears to be invalid or unauthorized. Please verify your API Key in Settings.`):new Error(`API Error (${p.status}): ${h}`);if(h.trim().startsWith("<"))throw new Error(`The endpoint "${d}" returned an HTML webpage instead of a JSON API response.

Possible causes:
1. Base URL was typed without "https://" (e.g. "sv4.alpakyros.com/v1" instead of "https://sv4.alpakyros.com/v1").
2. Base URL points to a frontend web app rather than an AI LLM gateway.

Please update your Base URL in Settings.`);let u;try{u=JSON.parse(h)}catch{throw new Error(`The endpoint "${d}" did not return valid JSON.

Response excerpt: ${h.slice(0,200)}`)}const x=u.choices?.[0]?.message?.content||"",m=x.replace(/^```json\s*/i,"").replace(/\s*```$/i,"").trim();let b=[];try{b=JSON.parse(m)}catch{throw console.warn("[LetMe AutoBug] Failed to parse raw JSON:",x),new Error("AI Vision model did not return a valid JSON array format.")}if(this.updateScanningStage(`Mapping ${b.length} detected visual issues & elements...`),await new Promise(v=>setTimeout(v,400)),this.hideScanningHUD(),!Array.isArray(b)||b.length===0){this.showToast("AI Vision Analysis Complete: No visual bugs found!");return}this.currentBugs=b,this.renderBugPins(b),this.renderFloatingDrawer(b,l),this.showToast(`Found ${b.length} visual issues! Check the highlighted elements & report drawer.`)}catch(s){this.hideScanningHUD(),console.error("[LetMe AutoBug] Error:",s),this.showModalAlert("Auto Bug Detection Failed",s.message)}}async rescaleImageToViewport(t,e,i){return new Promise(o=>{const n=new Image;n.onload=()=>{try{const s=document.createElement("canvas");s.width=e,s.height=i;const a=s.getContext("2d");a?(a.drawImage(n,0,0,e,i),o(s.toDataURL("image/jpeg",.9))):o(t)}catch{o(t)}},n.onerror=()=>o(t),n.src=t})}showScanningHUD(t){if(this.isLoading=!0,this.hideScanningHUD(),!document.getElementById("letme-scanner-styles")){const s=document.createElement("style");s.id="letme-scanner-styles",s.textContent=`
        @keyframes letmeScanBeam {
          0% { top: 0%; opacity: 0.9; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0.9; }
        }
        @keyframes letmeRadarPulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes letmeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes letmePinPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 16px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `,document.head.appendChild(s)}const e=document.createElement("div");e.id="letme-scanner-hud",e.className="letme-ui-root",e.style.position="fixed",e.style.top="0",e.style.left="0",e.style.width="100vw",e.style.height="100vh",e.style.pointerEvents="none",e.style.zIndex="2147483646",e.style.fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';const i=document.createElement("div");i.style.position="absolute",i.style.left="0",i.style.width="100%",i.style.height="3px",i.style.background="linear-gradient(90deg, transparent, #38bdf8 20%, #ffffff 50%, #38bdf8 80%, transparent)",i.style.boxShadow="0 0 15px #38bdf8, 0 0 30px rgba(56, 189, 248, 0.7)",i.style.animation="letmeScanBeam 2.4s ease-in-out infinite alternate";const o=document.createElement("div");o.style.width="100%",o.style.height="70px",o.style.background="linear-gradient(180deg, rgba(56, 189, 248, 0.12) 0%, transparent 100%)",i.appendChild(o),e.appendChild(i);const n=document.createElement("div");n.style.position="absolute",n.style.bottom="24px",n.style.left="50%",n.style.transform="translateX(-50%)",n.style.backgroundColor="rgba(9, 9, 11, 0.95)",n.style.backdropFilter="blur(10px)",n.style.border="1px solid #38bdf8",n.style.borderRadius="9999px",n.style.padding="8px 22px",n.style.color="#fafafa",n.style.display="flex",n.style.alignItems="center",n.style.gap="12px",n.style.boxShadow="0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.25)",n.style.pointerEvents="auto",n.innerHTML=`
      <span style="display:inline-flex; align-items:center; justify-content:center; animation: letmeSpin 1.4s linear infinite;">${f("radar",{size:18,color:"#38bdf8"})}</span>
      <div style="display:flex; flex-direction:column;">
        <span style="font-size:11px; font-weight:800; letter-spacing:0.8px; text-transform:uppercase; color:#fafafa;">AI VISION SCANNER</span>
        <span id="letme-scanner-stage-text" style="font-size:12px; color:#38bdf8; font-weight:500;">${t}</span>
      </div>
      <button id="letme-scanner-cancel" style="background:#18181b; border:1px solid #27272a; color:#a1a1aa; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:600; cursor:pointer; margin-left:8px; display:inline-flex; align-items:center; gap:4px; transition: all 0.15s;">
        <span>Cancel</span> ${f("x",{size:11})}
      </button>
    `,n.querySelector("#letme-scanner-cancel")?.addEventListener("click",()=>{this.hideScanningHUD(),this.showToast("AI Vision scan canceled.")}),e.appendChild(n),document.body.appendChild(e)}updateScanningStage(t){const e=document.getElementById("letme-scanner-stage-text");e&&(e.innerText=t)}hideScanningHUD(){this.isLoading=!1,document.getElementById("letme-scanner-hud")?.remove()}findElementByText(t,e,i){if(!t||t.trim().length<2)return null;const o=t.trim().toLowerCase(),n=[],s=document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, div, label, li, strong, b, code, input, [role="button"]');for(const l of s){if(l.closest(".letme-ui-root")||l.closest(".letme-autobug-element")||l.id?.startsWith("letme-")||l.className?.includes?.("letme-"))continue;const d=(l.innerText||l.textContent||"").trim().toLowerCase();if(d&&(d===o||d.includes(o)||o.includes(d))){const g=l.getBoundingClientRect();g.width>=6&&g.height>=6&&g.width<=window.innerWidth*.92&&g.height<=window.innerHeight*.92&&n.push(l)}}if(n.length===0)return null;if(n.length===1)return n[0];let a=n[0],r=1/0;for(const l of n){const d=l.getBoundingClientRect(),g=d.left+d.width/2,y=d.top+d.height/2,p=Math.hypot(g-e,y-i);p<r&&(r=p,a=l)}return a}findElementAtPoint(t,e){const i=[{x:t,y:e},{x:t+10,y:e+10},{x:t-10,y:e-10},{x:t+15,y:e},{x:t,y:e+15}];for(const o of i)try{const n=document.elementsFromPoint(o.x,o.y);for(const s of n)if(s instanceof HTMLElement){if(s.tagName==="BODY"||s.tagName==="HTML"||s.closest(".letme-ui-root")||s.closest(".letme-autobug-element")||s.id?.startsWith("letme-")||s.className?.includes?.("letme-"))continue;const a=s.getBoundingClientRect();if(a.width>=10&&a.height>=8&&a.width<=window.innerWidth*.92&&a.height<=window.innerHeight*.92)return s}}catch{}return null}resolveBugBounds(t){let e=null;const i=(t.title+" "+(t.description||"")).match(/['"‘“]([^'"’“”]{2,40})['"’“”]/)?.[1],o=t.target_text||i;if(o&&(e=this.findElementByText(o,t.x,t.y)),e||(e=this.findElementAtPoint(t.x,t.y)),e){const l=e.getBoundingClientRect(),d=e.tagName.toLowerCase(),g=e.id?`#${e.id}`:"",y=e.classList[0]?`.${e.classList[0]}`:"",p=`${d}${g||y}`;return{x:Math.round(l.left),y:Math.round(l.top),width:Math.round(l.width),height:Math.round(l.height),docX:Math.round(l.left+window.scrollX),docY:Math.round(l.top+window.scrollY),pinOffsetX:0,pinOffsetY:0,elementTag:`<${d}${g||y}>`,elementSelector:p,targetElement:e}}const n=Math.round(Math.max(0,t.x)),s=Math.round(Math.max(0,t.y)),a=t.width&&t.width>10?Math.round(t.width):120,r=t.height&&t.height>10?Math.round(t.height):40;return{x:n,y:s,width:a,height:r,docX:n+window.scrollX,docY:s+window.scrollY,pinOffsetX:0,pinOffsetY:0,elementTag:"<element>",targetElement:null}}handleScrollOrResize=()=>{this.rAFScheduled||(this.rAFScheduled=!0,requestAnimationFrame(()=>{this.rAFScheduled=!1,this.repositionAllPinsAndBoxes()}))};repositionAllPinsAndBoxes(){this.resolvedBoundsMap.forEach((t,e)=>{const i=document.getElementById(`letme-bug-box-${e}`),o=document.getElementById(`letme-bug-pin-${e}`);let n,s,a,r;if(t.targetElement&&t.targetElement.isConnected){const l=t.targetElement.getBoundingClientRect();n=Math.round(l.left),s=Math.round(l.top),a=Math.round(l.width),r=Math.round(l.height)}else n=Math.round(t.docX-window.scrollX),s=Math.round(t.docY-window.scrollY),a=t.width,r=t.height;i&&(i.style.left=`${n}px`,i.style.top=`${s}px`,i.style.width=`${a}px`,i.style.height=`${r}px`),o&&(o.style.left=`${n+t.pinOffsetX}px`,o.style.top=`${s+t.pinOffsetY}px`)})}renderBugPins(t){this.resolvedBoundsMap.clear(),this.scrollListenerAttached||(window.addEventListener("scroll",this.handleScrollOrResize,{passive:!0,capture:!0}),window.addEventListener("resize",this.handleScrollOrResize,{passive:!0}),this.scrollListenerAttached=!0);const e=[];t.forEach((i,o)=>{const n=this.resolveBugBounds(i);let s=0,a=-24;n.y+a<4&&(a=4);let r=n.x+s,l=n.y+a;for(const u of e)Math.abs(u.x-r)<42&&Math.abs(u.y-l)<22&&(s+=42,r=n.x+s,r+50>window.innerWidth&&(s=0,a+=24,r=n.x+s,l=n.y+a));e.push({x:r,y:l}),n.pinOffsetX=s,n.pinOffsetY=a,this.resolvedBoundsMap.set(o,n);const d=i.severity==="critical"?"#ef4444":i.severity==="warning"?"#f59e0b":"#38bdf8",g=i.severity==="critical"?"rgba(239, 68, 68, 0.05)":i.severity==="warning"?"rgba(245, 158, 11, 0.05)":"rgba(56, 189, 248, 0.05)",y=i.severity==="critical"?f("alert-circle",{size:11,color:d}):i.severity==="warning"?f("alert-triangle",{size:11,color:d}):f("info",{size:11,color:d}),p=document.createElement("div");p.id=`letme-bug-box-${o}`,p.className="letme-autobug-element letme-ui-root",p.style.position="fixed",p.style.left=`${n.x}px`,p.style.top=`${n.y}px`,p.style.width=`${n.width}px`,p.style.height=`${n.height}px`,p.style.border=`2px dashed ${d}`,p.style.borderRadius="6px",p.style.backgroundColor=g,p.style.boxShadow="0 0 0 1px rgba(0, 0, 0, 0.25)",p.style.zIndex="2147483640",p.style.pointerEvents="auto",p.style.cursor="pointer",p.style.transition="background-color 0.15s, box-shadow 0.15s, border-color 0.15s, border-style 0.15s",p.addEventListener("mouseenter",()=>{p.style.borderStyle="solid",p.style.backgroundColor="rgba(239, 68, 68, 0.15)",p.style.boxShadow=`0 0 16px ${d}`}),p.addEventListener("mouseleave",()=>{p.style.borderStyle="dashed",p.style.backgroundColor=g,p.style.boxShadow="0 0 0 1px rgba(0, 0, 0, 0.25)"}),p.addEventListener("click",()=>{this.focusBugCardInDrawer(o),this.highlightPin(o)}),document.body.appendChild(p),this.activePins.push(p);const h=document.createElement("div");h.id=`letme-bug-pin-${o}`,h.className="letme-autobug-element letme-ui-root",h.style.position="fixed",h.style.left=`${r}px`,h.style.top=`${l}px`,h.style.zIndex="2147483645",h.style.cursor="pointer",h.style.fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',h.style.transition="transform 0.15s ease-out",h.innerHTML=`
        <div class="letme-pin-badge" style="display: inline-flex; align-items: center; gap: 4px; background: #09090b; border: 1.5px solid ${d}; padding: 2px 7px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); color: #fafafa; font-size: 11px; font-weight: 800; white-space: nowrap; transition: all 0.15s ease;">
          <span style="display: inline-flex; align-items: center;">${y}</span>
          <span>#${o+1}</span>
        </div>
        <div class="letme-pin-tooltip" style="position: absolute; bottom: calc(100% + 6px); left: 0; background: #09090b; border: 1px solid #27272a; color: #fafafa; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap; pointer-events: none; opacity: 0; transform: translateY(4px); transition: all 0.15s ease; box-shadow: 0 8px 20px rgba(0,0,0,0.7); z-index: 2147483647; display: flex; align-items: center; gap: 6px;">
          <span style="color: ${d}; font-weight: 800;">#${o+1}</span>
          <span style="max-width: 240px; overflow: hidden; text-overflow: ellipsis;">${i.title}</span>
        </div>
      `,h.addEventListener("mouseenter",()=>{const u=h.querySelector(".letme-pin-badge"),x=h.querySelector(".letme-pin-tooltip");u&&(u.style.transform="scale(1.1)",u.style.borderColor="#ffffff",u.style.boxShadow=`0 0 12px ${d}`),x&&(x.style.opacity="1",x.style.transform="translateY(0)"),p.style.borderStyle="solid",p.style.boxShadow=`0 0 16px ${d}`}),h.addEventListener("mouseleave",()=>{const u=h.querySelector(".letme-pin-badge"),x=h.querySelector(".letme-pin-tooltip");u&&(u.style.transform="",u.style.borderColor=d,u.style.boxShadow="0 4px 12px rgba(0,0,0,0.6)"),x&&(x.style.opacity="0",x.style.transform="translateY(4px)"),p.style.borderStyle="dashed",p.style.boxShadow="0 0 0 1px rgba(0, 0, 0, 0.25)"}),h.addEventListener("click",()=>{this.focusBugCardInDrawer(o),this.highlightPin(o)}),document.body.appendChild(h),this.activePins.push(h)})}renderFloatingDrawer(t,e){document.getElementById("letme-bug-drawer")?.remove();const i=document.createElement("div");i.id="letme-bug-drawer",i.className="letme-ui-root",i.style.position="fixed",i.style.bottom="20px",i.style.right="20px",i.style.width="420px",i.style.maxWidth="calc(100vw - 40px)",i.style.maxHeight="620px",i.style.backgroundColor="#09090b",i.style.border="1px solid #27272a",i.style.borderRadius="14px",i.style.boxShadow="0 25px 50px -12px rgba(0,0,0,0.85), 0 0 20px rgba(0,0,0,0.5)",i.style.zIndex="2147483647",i.style.display="flex",i.style.flexDirection="column",i.style.overflow="hidden",i.style.fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',i.style.color="#fafafa";const o=t.filter(a=>a.severity==="critical").length,n=t.filter(a=>a.severity==="warning").length,s=t.filter(a=>a.severity==="suggestion").length;i.innerHTML=`
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #18181b; background:#121215;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-flex; align-items:center; color:#38bdf8;">${f("bot",{size:16,color:"#38bdf8"})}</span>
          <span style="font-size:13px; font-weight:700; color:#fafafa;">AI Bug Report</span>
          <span style="background:#27272a; color:#fafafa; font-size:10px; font-weight:700; padding:2px 7px; border-radius:9999px;">
            ${t.length} Issues
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button id="letme-drawer-minimize" title="Minimize drawer" style="background:none; border:1px solid #27272a; color:#a1a1aa; border-radius:6px; width:26px; height:26px; cursor:pointer; display:flex; align-items:center; justify-content:center;">${f("minus",{size:13})}</button>
          <button id="letme-drawer-close" title="Dismiss all pins" style="background:none; border:1px solid #27272a; color:#a1a1aa; border-radius:6px; width:26px; height:26px; cursor:pointer; display:flex; align-items:center; justify-content:center;">${f("x",{size:13})}</button>
        </div>
      </div>

      <!-- Severity Filters -->
      <div style="display:flex; gap:6px; padding:10px 16px; border-bottom:1px solid #18181b; background:#09090b; font-size:11px;">
        <button class="letme-filter-btn active" data-filter="all" style="background:#27272a; border:none; color:#fafafa; padding:4px 9px; border-radius:9999px; font-weight:600; cursor:pointer;">
          All (${t.length})
        </button>
        ${o>0?`
          <button class="letme-filter-btn" data-filter="critical" style="background:#18181b; border:1px solid #ef4444; color:#ef4444; padding:4px 9px; border-radius:9999px; font-weight:600; cursor:pointer;">
            Critical (${o})
          </button>
        `:""}
        ${n>0?`
          <button class="letme-filter-btn" data-filter="warning" style="background:#18181b; border:1px solid #f59e0b; color:#f59e0b; padding:4px 9px; border-radius:9999px; font-weight:600; cursor:pointer;">
            Warning (${n})
          </button>
        `:""}
        ${s>0?`
          <button class="letme-filter-btn" data-filter="suggestion" style="background:#18181b; border:1px solid #38bdf8; color:#38bdf8; padding:4px 9px; border-radius:9999px; font-weight:600; cursor:pointer;">
            Suggestion (${s})
          </button>
        `:""}
      </div>

      <!-- Bug Cards Container -->
      <div id="letme-drawer-list" style="overflow-y:auto; max-height:360px; padding:12px 16px; display:flex; flex-direction:column; gap:10px; background:#09090b;">
        <!-- Filled by renderBugCardsIntoContainer() -->
      </div>

      <!-- Action Footer -->
      <div style="padding:12px 16px; border-top:1px solid #18181b; background:#121215; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; gap:8px;">
          <button id="letme-btn-copy-all" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:#18181b; border:1px solid #27272a; color:#fafafa; padding:8px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s;">
            ${f("copy",{size:13})} <span>Copy All (Markdown)</span>
          </button>
          <button id="letme-btn-sync-all-mcp" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:#fafafa; border:none; color:#09090b; padding:8px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; transition:opacity 0.15s;">
            ${f("zap",{size:13,color:"#09090b"})} <span>Send All to MCP</span>
          </button>
        </div>
        <button id="letme-btn-clear-all" style="background:none; border:none; color:#71717a; font-size:11px; cursor:pointer; text-align:center; display:flex; align-items:center; justify-content:center; gap:5px; margin-top:2px;">
          ${f("trash-2",{size:12,color:"#71717a"})} <span>Clear All ${t.length} Pins & Close</span>
        </button>
      </div>
    `,document.body.appendChild(i),this.activePins.push(i),this.renderBugCardsIntoContainer(t),i.querySelectorAll(".letme-filter-btn").forEach(a=>{a.addEventListener("click",r=>{const l=r.currentTarget,d=l.getAttribute("data-filter");this.activeFilter=d,i.querySelectorAll(".letme-filter-btn").forEach(g=>{g.style.background="#18181b",g.style.color="#a1a1aa"}),l.style.background="#27272a",l.style.color="#fafafa",this.renderBugCardsIntoContainer(t)})}),i.querySelector("#letme-drawer-minimize")?.addEventListener("click",()=>{i.style.display="none",this.showMinimizedPill(t.length)}),i.querySelector("#letme-drawer-close")?.addEventListener("click",()=>{this.clearPins()}),i.querySelector("#letme-btn-clear-all")?.addEventListener("click",()=>{this.clearPins()}),i.querySelector("#letme-btn-copy-all")?.addEventListener("click",()=>{this.copyAllBugsMarkdown(t)}),i.querySelector("#letme-btn-sync-all-mcp")?.addEventListener("click",()=>{this.syncAllBugsToMcp(t,e)})}renderBugCardsIntoContainer(t){const e=document.getElementById("letme-drawer-list");if(!e)return;e.innerHTML="";const i=this.activeFilter==="all"?t:t.filter(o=>o.severity===this.activeFilter);if(i.length===0){e.innerHTML=`
        <div style="padding:20px; text-align:center; color:#71717a; font-size:12px;">
          No bugs found under "${this.activeFilter}" filter.
        </div>
      `;return}i.forEach(o=>{const n=t.indexOf(o),s=this.resolvedBoundsMap.get(n),a=o.severity==="critical"?"#ef4444":o.severity==="warning"?"#f59e0b":"#38bdf8",r=document.createElement("div");r.id=`letme-drawer-card-${n}`,r.style.backgroundColor="#121215",r.style.border="1px solid #27272a",r.style.borderLeft=`3.5px solid ${a}`,r.style.borderRadius="8px",r.style.padding="10px 12px",r.style.display="flex",r.style.flexDirection="column",r.style.gap="6px",r.style.cursor="pointer",r.style.transition="all 0.15s",r.innerHTML=`
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; font-weight:700; color:#fafafa;">#${n+1} ${o.title}</span>
          <span style="font-size:9px; font-weight:800; text-transform:uppercase; padding:2px 6px; border-radius:4px; background:${a}; color:#000;">
            ${o.severity}
          </span>
        </div>
        <p style="font-size:12px; color:#d4d4d8; line-height:1.45; margin:0;">${o.description}</p>
        ${o.fix?`
          <div style="background:#18181b; border:1px solid #27272a; border-radius:6px; padding:6px 8px; font-size:11px;">
            <span style="display:inline-flex; align-items:center; gap:4px; color:#a1a1aa; font-weight:600;">${f("lightbulb",{size:12,color:"#f59e0b"})} Fix: </span>
            <span style="color:#38bdf8; font-family:monospace;">${o.fix}</span>
          </div>
        `:""}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
          <span style="display:inline-flex; align-items:center; gap:6px; font-size:10px; color:#71717a; font-family:monospace;">
            ${s?.elementTag?`<span style="display:inline-flex; align-items:center; gap:3px;">${f("square",{size:10,color:"#71717a"})} ${s.elementTag}</span>`:""}
            <span style="display:inline-flex; align-items:center; gap:3px;">${f("locate-fixed",{size:10,color:"#71717a"})} (${s?.width||o.width||0}×${s?.height||o.height||0}px)</span>
          </span>
          <span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#38bdf8; font-weight:600;">
            <span>Focus Element</span> ${f("external-link",{size:11,color:"#38bdf8"})}
          </span>
        </div>
      `,r.addEventListener("mouseenter",()=>{r.style.backgroundColor="#18181b",r.style.borderColor="#3f3f46";const l=document.getElementById(`letme-bug-box-${n}`);l&&(l.style.borderStyle="solid",l.style.borderWidth="2px",l.style.boxShadow=`0 0 20px ${a}`)}),r.addEventListener("mouseleave",()=>{r.style.backgroundColor="#121215",r.style.borderColor="#27272a";const l=document.getElementById(`letme-bug-box-${n}`);l&&(l.style.borderStyle="dashed",l.style.borderWidth="2px",l.style.boxShadow="0 0 0 1px rgba(0, 0, 0, 0.25)")}),r.addEventListener("click",()=>{this.scrollToBug(n),this.highlightPin(n)}),e.appendChild(r)})}showMinimizedPill(t){document.getElementById("letme-bug-minimized-pill")?.remove();const e=document.createElement("div");e.id="letme-bug-minimized-pill",e.className="letme-ui-root",e.style.position="fixed",e.style.bottom="20px",e.style.right="20px",e.style.backgroundColor="#09090b",e.style.border="1px solid #38bdf8",e.style.borderRadius="9999px",e.style.padding="8px 16px",e.style.color="#fafafa",e.style.fontSize="12px",e.style.fontWeight="700",e.style.boxShadow="0 10px 25px rgba(0,0,0,0.7), 0 0 15px rgba(56, 189, 248, 0.3)",e.style.cursor="pointer",e.style.zIndex="2147483647",e.style.display="flex",e.style.alignItems="center",e.style.gap="8px",e.innerHTML=`
      <div style="display:inline-flex; align-items:center; gap:6px;">
        ${f("bot",{size:15,color:"#38bdf8"})}
        <span>${t} Visual Bugs</span>
      </div>
      <span style="display:inline-flex; align-items:center; gap:4px; background:#18181b; border:1px solid #27272a; padding:2px 8px; border-radius:9999px; font-size:10px; color:#38bdf8;">
        <span>Expand</span> ${f("chevron-up",{size:11,color:"#38bdf8"})}
      </span>
    `,e.addEventListener("click",()=>{e.remove();const i=document.getElementById("letme-bug-drawer");i&&(i.style.display="flex")}),document.body.appendChild(e),this.activePins.push(e)}scrollToBug(t){const e=this.resolvedBoundsMap.get(t);e&&(e.targetElement&&e.targetElement.isConnected?e.targetElement.scrollIntoView({behavior:"smooth",block:"center"}):window.scrollTo({top:Math.max(0,e.docY-140),left:Math.max(0,e.docX-100),behavior:"smooth"}))}highlightPin(t){const e=document.getElementById(`letme-bug-pin-${t}`),i=document.getElementById(`letme-bug-box-${t}`);if(e&&(e.style.animation="letmePinPulse 1.2s ease-out",setTimeout(()=>{e.style.animation=""},1300)),i){const o=this.currentBugs[t]?.severity==="critical"?"#ef4444":this.currentBugs[t]?.severity==="warning"?"#f59e0b":"#38bdf8";i.style.border="3px solid #ffffff",i.style.backgroundColor="rgba(255, 255, 255, 0.3)",i.style.boxShadow=`0 0 30px ${o}, 0 0 12px #ffffff`,i.style.transform="scale(1.03)",setTimeout(()=>{i.style.border=`2px dashed ${o}`,i.style.backgroundColor="",i.style.boxShadow="0 0 0 1px rgba(0, 0, 0, 0.25)",i.style.transform=""},1500)}}focusBugCardInDrawer(t){const e=document.getElementById("letme-bug-drawer");e&&e.style.display==="none"&&(e.style.display="flex",document.getElementById("letme-bug-minimized-pill")?.remove());const i=document.getElementById(`letme-drawer-card-${t}`);i&&(i.scrollIntoView({behavior:"smooth",block:"nearest"}),i.style.backgroundColor="#27272a",setTimeout(()=>{i.style.backgroundColor="#121215"},1e3))}copyAllBugsMarkdown(t){const e=[];e.push("# LetMe AI Vision Bug Report"),e.push(`- **Page Title**: ${document.title}`),e.push(`- **URL**: ${window.location.href}`),e.push(`- **Viewport**: ${window.innerWidth}px × ${window.innerHeight}px`),e.push(`- **Timestamp**: ${new Date().toISOString()}`),e.push(`- **Total Issues Found**: ${t.length}`),e.push(""),e.push("---"),e.push(""),t.forEach((o,n)=>{const s=this.resolvedBoundsMap.get(n);e.push(`### ${n+1}. [${o.severity.toUpperCase()}] ${o.title}`),s?.elementSelector&&e.push(`- **Target DOM Element**: \`${s.elementSelector}\``),e.push(`- **Bounding Box**: x: ${s?.x??o.x}px, y: ${s?.y??o.y}px, size: ${s?.width??o.width??"auto"}px × ${s?.height??o.height??"auto"}px`),e.push(`- **Problem**: ${o.description}`),o.fix&&e.push(`- **Suggested Fix**: \`${o.fix}\``),e.push("")}),e.push("---"),e.push("*Generated automatically by LetMe AI Vision Inspector for Coding Agents (Antigravity / Cursor / Claude).*");const i=e.join(`
`);navigator.clipboard.writeText(i).then(()=>{this.showToast(`Copied all ${t.length} bug reports to clipboard! Ready to paste to AI.`)})}async syncAllBugsToMcp(t,e){const i=`LTM-AI-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Date.now().toString(36).slice(-3).toUpperCase()}`,o=t.map((r,l)=>{const d=this.resolvedBoundsMap.get(l),g=d?.elementSelector?` [${d.elementSelector}]`:"";return`### Issue #${l+1} [${r.severity.toUpperCase()}]${g}
- **Title**: ${r.title}
- **Description**: ${r.description}
- **Suggested Fix**: \`${r.fix||"N/A"}\``}).join(`

`);await chrome.runtime.sendMessage({type:"ELEMENT_CAPTURED",payload:{id:i,timestamp:Date.now(),url:window.location.href,pageTitle:document.title,selector:`body [LetMe Batch #${i}: ${t.length} Issues]`,tagName:"AI-VISION-BUG-REPORT",classNames:["letme-ai-bug-report"],outerHtmlSnippet:`<!-- LetMe AI Vision Scan: ${t.length} Issues Synced under ID [${i}] on ${document.title} -->`,boxModel:{width:window.innerWidth,height:window.innerHeight,margin:{top:0,right:0,bottom:0,left:0},border:{top:0,right:0,bottom:0,left:0},padding:{top:0,right:0,bottom:0,left:0},content:{width:window.innerWidth,height:window.innerHeight},boundingBox:{x:0,y:0,top:0,left:0,right:window.innerWidth,bottom:window.innerHeight,width:window.innerWidth,height:window.innerHeight}},layoutContext:{parentTagName:"html",parentSelector:"html",display:"block",position:"static",isFlexChild:!1,isGridChild:!1},layoutBugs:{hasHorizontalScrollLeak:document.documentElement.scrollWidth>window.innerWidth,isClippedByAncestor:!1,hasZIndexConflict:!1,zIndex:"auto",warnings:t.map(r=>`[${r.severity.toUpperCase()}] ${r.title}: ${r.description}`)},computedStyles:{},userInstructions:`Perbaiki ${t.length} bug visual dan masalah layout pada laporan LetMe [${i}].`,userBugNotes:o,annotations:t.map((r,l)=>{const d=this.resolvedBoundsMap.get(l);return{type:"bug",x:d?.x??r.x,y:d?.y??r.y,width:d?.width??r.width??80,height:d?.height??r.height??40,color:r.severity==="critical"?"#ef4444":r.severity==="warning"?"#f59e0b":"#38bdf8",text:`#${l+1} ${r.title}`}}),screenshotDataUrl:e,viewport:{width:window.innerWidth,height:window.innerHeight,devicePixelRatio:window.devicePixelRatio||1}}});const n=[];n.push(`[LETME MCP REPORT: ${i}]`),n.push(`Saya baru saja menginspeksi halaman "${document.title}" (${window.location.href}) dan mengirimkan laporan ${t.length} isu visual ke LetMe MCP Bridge.`),n.push(""),n.push("**PENTING UNTUK CODING AGENT**:"),n.push(`Panggil MCP tool \`letme_get_active_element(id="${i}")\` untuk membaca data lengkap payload (screenshot visual dengan penanda, bounding box, CSS computed, selector DOM, dan diagnosa layout).`),n.push(""),n.push(`Berikut ringkasan ${t.length} masalah visual yang perlu Anda selesaikan:`),t.forEach((r,l)=>{const d=this.resolvedBoundsMap.get(l),g=d?.elementSelector?` (\`${d.elementSelector}\`)`:"";n.push(`${l+1}. [${r.severity.toUpperCase()}] **${r.title}**${g}: ${r.description}`),r.fix&&n.push(`   Saran Solusi: \`${r.fix}\``)}),n.push(""),n.push("Tolong telusuri kode frontend proyek ini dan perbaiki seluruh masalah di atas.");const s=n.join(`
`);try{await navigator.clipboard.writeText(s)}catch{const r=document.createElement("textarea");r.value=s,r.style.position="fixed",r.style.opacity="0",document.body.appendChild(r),r.select(),document.execCommand("copy"),r.remove()}const a=document.getElementById("letme-btn-sync-all-mcp");if(a){const r=a.innerHTML;a.innerHTML=`<span style="display:inline-flex; align-items:center; gap:4px;">${f("check",{size:13,color:"#ffffff"})} Copied [${i}]!</span>`,a.style.background="#10b981",a.style.color="#ffffff",setTimeout(()=>{a.innerHTML=r,a.style.background="#fafafa",a.style.color="#09090b"},2500)}this.showToast(`Synced to MCP & Copied Prompt [${i}]! Tinggal Paste (Ctrl+V) di chat AI Anda.`)}clearPins(){this.scrollListenerAttached&&(window.removeEventListener("scroll",this.handleScrollOrResize,{capture:!0}),window.removeEventListener("resize",this.handleScrollOrResize),this.scrollListenerAttached=!1),this.activePins.forEach(t=>t.remove()),this.activePins=[],this.resolvedBoundsMap.clear(),document.getElementById("letme-bug-drawer")?.remove(),document.getElementById("letme-bug-minimized-pill")?.remove(),this.hideScanningHUD()}showModalAlert(t,e){const i=document.getElementById("letme-autobug-alert");i&&i.remove();const o=document.createElement("div");o.id="letme-autobug-alert",o.className="letme-ui-root",o.style.position="fixed",o.style.top="0",o.style.left="0",o.style.width="100vw",o.style.height="100vh",o.style.backgroundColor="rgba(0, 0, 0, 0.65)",o.style.backdropFilter="blur(4px)",o.style.display="flex",o.style.alignItems="center",o.style.justifyContent="center",o.style.zIndex="2147483647",o.style.fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';const n=document.createElement("div");n.style.width="440px",n.style.maxWidth="92vw",n.style.backgroundColor="#09090b",n.style.border="1px solid #27272a",n.style.borderRadius="12px",n.style.padding="20px",n.style.color="#fafafa",n.style.boxShadow="0 20px 40px rgba(0, 0, 0, 0.8)",n.style.display="flex",n.style.flexDirection="column",n.style.gap="14px",n.innerHTML=`
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; background:rgba(245, 158, 11, 0.15);">
          ${f("alert-triangle",{size:16,color:"#f59e0b"})}
        </span>
        <h3 style="margin:0; font-size:15px; font-weight:700; color:#fafafa;">${t}</h3>
      </div>
      <div style="font-size:13px; line-height:1.55; color:#a1a1aa; white-space:pre-wrap;">${e}</div>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:6px;">
        <button id="letme-alert-close" style="background:#ffffff; color:#000000; border:none; padding:7px 18px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">Dismiss</button>
      </div>
    `,o.appendChild(n),document.body.appendChild(o),o.querySelector("#letme-alert-close")?.addEventListener("click",()=>{o.remove()}),o.addEventListener("click",s=>{s.target===o&&o.remove()})}showToast(t){const e=document.createElement("div");e.style.position="fixed",e.style.top="20px",e.style.left="50%",e.style.transform="translateX(-50%)",e.style.backgroundColor="#09090b",e.style.border="1px solid #27272a",e.style.color="#fafafa",e.style.padding="8px 18px",e.style.borderRadius="9999px",e.style.fontSize="12px",e.style.fontWeight="600",e.style.zIndex="2147483647",e.style.boxShadow="0 10px 25px rgba(0,0,0,0.5)",e.innerText=t,document.body.appendChild(e),setTimeout(()=>{e.style.opacity="0",e.style.transition="opacity 0.4s ease",setTimeout(()=>e.remove(),400)},3e3)}}const F=new at,K=[{label:"Montserrat",value:'"Montserrat", "Segoe UI", sans-serif'},{label:"Poppins",value:'"Poppins", "Segoe UI", sans-serif'},{label:"Calibri",value:'Calibri, "Segoe UI", sans-serif'},{label:"Arial",value:"Arial, Helvetica, sans-serif"},{label:"4-Bit",value:'"Press Start 2P", "Courier New", monospace'}],rt=["#ffffff","#a1a1aa","#ef4444","#f97316","#f59e0b","#10b981","#38bdf8","#a855f7"],lt='<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>',dt='<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>',ct='<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14 20 9l-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/></svg>',Z='<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',ht='<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',pt='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="3"/><path d="M15 3v18"/></svg>',I=[{id:"box",title:"Box",icon:f("square",{size:16})},{id:"rounded-box",title:"Rounded Box",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/></svg>'},{id:"circle",title:"Circle / Ellipse",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>'},{id:"diamond",title:"Diamond",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 12 12 22 2 12"/></svg>'},{id:"triangle",title:"Triangle",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 22 20 2 20"/></svg>'},{id:"callout",title:"Pill",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="6"/></svg>'}],ut=`
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

  .hud-card {
    background-color: #08080a;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 16px 16px;
    border: 1px solid #3f3f46;
    color: #fafafa;
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.88);
  }

  .hud-menu-btn {
    position: fixed; top: 16px; left: 16px; z-index: 2147483647;
    width: 38px; height: 38px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .hud-menu-btn:hover, .hud-menu-btn.active { background: #ffffff; color: #000000; border-color: #ffffff; }

  .hud-right-toggle {
    position: fixed; top: 16px; right: 16px; z-index: 2147483647;
    height: 38px; padding: 0 10px; border-radius: 9px;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    cursor: pointer; font-size: 11px; font-weight: 700;
  }
  .hud-right-toggle:hover { border-color: #ffffff; }

  .hud-toolbar {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
    display: inline-flex; align-items: center; gap: 2px; padding: 4px 6px; border-radius: 10px;
    max-width: calc(100vw - 140px); overflow-x: auto;
  }
  .hud-toolbar-collapsed {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
    padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; cursor: pointer;
    display: inline-flex; align-items: center; gap: 7px;
  }
  .hud-toolbar-collapsed:hover { border-color: #ffffff; }
  .hud-toolbar-collapsed img { width: 18px; height: 18px; border-radius: 4px; display: block; }

  .tb-btn {
    position: relative; width: 30px; height: 30px; border-radius: 7px;
    border: 1px solid transparent; background: transparent; color: #d4d4d8;
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .tb-btn:hover { background: #18181b; color: #ffffff; border-color: #3f3f46; }
  .tb-btn.active { background: #ffffff; color: #000000; border-color: #ffffff; }
  .tb-btn.danger:hover { border-color: #ef4444; color: #ef4444; }
  .tb-key {
    position: absolute; bottom: 1px; right: 2px; font-size: 8px; font-weight: 700;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; opacity: 0.72; line-height: 1;
  }
  .tb-sep { width: 1px; height: 20px; background: #27272a; margin: 0 3px; flex-shrink: 0; }

  .color-trigger {
    width: 20px; height: 20px; border-radius: 9999px; border: 2px solid #ffffff;
    cursor: pointer; margin: 0 3px; flex-shrink: 0;
  }
  .px-stepper {
    display: inline-flex; align-items: center; gap: 2px; padding: 2px 4px;
    border: 1px solid #3f3f46; border-radius: 6px; background: #050505; flex-shrink: 0;
  }
  .px-val {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px; font-weight: 700; color: #ffffff; min-width: 24px; text-align: center;
  }
  .px-arrows { display: flex; flex-direction: column; gap: 1px; }
  .px-arr-btn {
    width: 14px; height: 10px; border: none; background: #18181b; color: #d4d4d8;
    font-size: 7px; line-height: 1; cursor: pointer; border-radius: 2px;
    display: flex; align-items: center; justify-content: center; padding: 0;
  }
  .px-arr-btn:hover { background: #ffffff; color: #000000; }
  .font-select {
    background: #050505; border: 1px solid #3f3f46; border-radius: 6px;
    color: #ffffff; font-size: 10px; font-weight: 600; padding: 4px 6px;
    outline: none; cursor: pointer; max-width: 92px; flex-shrink: 0;
  }
  .font-select:focus { border-color: #ffffff; }

  /* Popover Modals (Shapes & Color) */
  .tb-popover {
    position: fixed; top: 62px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
    padding: 10px 12px; border-radius: 10px; min-width: 196px;
  }
  .pop-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px;
    color: #a1a1aa; margin-bottom: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    display: flex; justify-content: space-between; align-items: center;
  }
  .shapes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .shape-opt {
    display: flex; align-items: center; justify-content: center;
    height: 38px; border-radius: 7px; border: 1px solid #2e2e32;
    background: #050505; color: #d4d4d8; cursor: pointer;
  }
  .shape-opt:hover { border-color: #ffffff; color: #ffffff; }
  .shape-opt.active { background: #ffffff; color: #000000; border-color: #ffffff; }

  .color-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; justify-items: center; }
  .color-cell {
    width: 26px; height: 26px; border-radius: 9999px; border: 1.5px solid #3f3f46; cursor: pointer; padding: 0;
  }
  .color-cell.active { border-color: #ffffff; box-shadow: 0 0 0 2px #050505, 0 0 0 3.5px #ffffff; }
  .color-custom-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #d4d4d8; }
  .color-native { width: 26px; height: 26px; border: 1px solid #3f3f46; border-radius: 9999px; background: none; padding: 0; cursor: pointer; overflow: hidden; }
  .hex-input {
    width: 84px; background: #050505; border: 1px solid #3f3f46; border-radius: 5px;
    color: #ffffff; padding: 4px 6px; font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; outline: none;
  }
  .hex-input:focus { border-color: #ffffff; }

  .close-sym {
    background: #121215; border: 1px solid #2e2e32; color: #d4d4d8; border-radius: 5px;
    width: 22px; height: 22px; cursor: pointer; padding: 0;
    display: flex; align-items: center; justify-content: center; line-height: 1;
  }
  .close-sym:hover { background: #ffffff; color: #000000; border-color: #ffffff; }

  /* Left Layers Drawer */
  .hud-drawer {
    position: fixed; top: 62px; left: 16px; z-index: 2147483647;
    width: 356px; max-height: calc(100vh - 84px); border-radius: 10px;
    display: flex; flex-direction: column; overflow: hidden; font-size: 12px;
  }
  .drawer-head {
    padding: 9px 12px; background: #050505; border-bottom: 1px dashed #2e2e32;
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
  }
  .brand-wrap { display: flex; align-items: center; gap: 6px; }
  .brand-logo { width: 18px; height: 18px; border-radius: 4px; display: block; }
  .brand-title { font-weight: 700; font-size: 12px; color: #ffffff; }
  .toggle-chip {
    background: #121215; border: 1px solid #3f3f46; color: #fafafa; border-radius: 4px;
    padding: 3px 7px; font-size: 10px; font-weight: 600; cursor: pointer;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  }
  .toggle-chip:hover { border-color: #ffffff; }
  .toggle-chip.active { background: #ffffff; color: #000000; border-color: #ffffff; }
  .toggle-chip.danger:hover { border-color: #ef4444; color: #ef4444; }
  .drawer-body { padding: 10px 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .section-head {
    display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.7px; color: #a1a1aa;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .layers-box { border: 1px solid #2e2e32; border-radius: 6px; background: rgba(5,5,5,0.9); overflow: hidden; }
  .layers-empty { padding: 16px 12px; text-align: center; color: #71717a; font-size: 11px; }
  .layer-row {
    display: flex; align-items: center; gap: 6px; padding: 6px 8px;
    border-bottom: 1px solid #18181b; cursor: pointer;
  }
  .layer-row:last-child { border-bottom: none; }
  .layer-row:hover { background: #141418; }
  .layer-row.active { background: #1f1f24; border-left: 2px solid #ffffff; }
  .layer-eye { background: none; border: none; color: #a1a1aa; cursor: pointer; padding: 2px; display: inline-flex; flex-shrink: 0; }
  .layer-eye.off { opacity: 0.35; }
  .layer-thumb {
    width: 40px; height: 26px; border-radius: 4px; border: 1px solid #3f3f46; background: #000000;
    overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .layer-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .layer-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .layer-top { display: flex; align-items: center; gap: 5px; }
  .layer-idx {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; font-weight: 700;
    color: #000000; background: #ffffff; border-radius: 3px; padding: 1px 4px; flex-shrink: 0;
  }
  .layer-name {
    flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #fafafa;
  }
  .layer-sub {
    display: flex; align-items: center; gap: 6px; font-size: 9px; color: #a1a1aa;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .layer-tag-badge {
    font-size: 8px; font-weight: 700; text-transform: uppercase; padding: 1px 4px;
    border-radius: 3px; border: 1px solid #3f3f46; background: #050505; color: #d4d4d8;
  }
  .layer-raw-btn {
    background: #121215; border: 1px solid #2e2e32; color: #d4d4d8; border-radius: 3px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; font-weight: 700;
    padding: 2px 5px; cursor: pointer; flex-shrink: 0;
  }
  .layer-raw-btn:hover { background: #ffffff; color: #000000; border-color: #ffffff; }
  .layer-trash {
    background: none; border: none; color: #71717a; cursor: pointer; padding: 3px;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 4px;
  }
  .layer-trash:hover { color: #ef4444; background: #18181b; }

  .final-notes-wrap { border-top: 1px dashed #2e2e32; padding-top: 8px; display: flex; flex-direction: column; gap: 6px; }
  .final-toggle-btn {
    width: 100%; background: #050505; border: 1px solid #2e2e32; color: #d4d4d8; border-radius: 5px;
    padding: 5px 8px; font-size: 10px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: space-between;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .final-toggle-btn:hover { border-color: #ffffff; color: #ffffff; }

  /* Side-by-Side Properties Modal */
  .hud-props-modal {
    position: fixed; top: 62px; left: 380px; z-index: 2147483647;
    width: 300px; max-height: calc(100vh - 84px); border-radius: 10px;
    display: flex; flex-direction: column; overflow: hidden; font-size: 12px;
  }
  .props-body { padding: 10px 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 9px; }
  .props-preview {
    width: 100%; height: 108px; border-radius: 6px; border: 1px solid #3f3f46; background: #000000;
    overflow: hidden; display: flex; align-items: center; justify-content: center; color: #71717a; font-size: 10px;
  }
  .props-preview img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .props-meta { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; color: #a1a1aa; line-height: 1.45; }
  .props-meta b { color: #ffffff; }
  .bug-alert { padding: 6px 8px; border: 1px dashed #ffffff; border-radius: 4px; background: #121215; font-size: 10px; color: #e4e4e7; }
  .tag-pills { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .tag-pill {
    padding: 4px 6px; border-radius: 4px; border: 1px solid #2e2e32; background: #050505;
    color: #a1a1aa; font-size: 10px; font-weight: 600; text-transform: uppercase; cursor: pointer; text-align: center;
  }
  .tag-pill.active { background: #ffffff; color: #000000; border-color: #ffffff; }
  .note-input {
    width: 100%; min-height: 60px; background: #050505; border: 1px solid #2e2e32;
    border-radius: 5px; color: #fafafa; padding: 6px 8px; font-size: 11px; resize: vertical; outline: none;
  }
  .note-input:focus { border-color: #ffffff; }

  /* Raw Preview Modal */
  .raw-modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2147483647;
    width: 480px; max-width: 92vw; max-height: 78vh; border-radius: 10px;
    display: flex; flex-direction: column; overflow: hidden;
  }
  .raw-pre {
    margin: 0; padding: 12px; background: #050505; color: #e4e4e7; font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap;
    word-break: break-word; overflow-y: auto; max-height: 58vh;
  }

  /* Full-Height Right Slider */
  .hud-right-slider {
    position: fixed; top: 16px; right: 16px; bottom: 68px; z-index: 2147483647;
    width: 324px; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;
  }
  .hud-exit-fab {
    position: fixed; bottom: 18px; right: 18px; z-index: 2147483647;
    width: 38px; height: 38px; border-radius: 9999px;
    background: #ef4444; border: 1.5px solid rgba(255, 255, 255, 0.85); color: #ffffff;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    opacity: 0.28; transition: opacity 0.18s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .hud-exit-fab:hover {
    opacity: 1; transform: scale(1.08);
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.55);
  }
  .studio-tabs {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;
    padding: 6px 12px 0; background: #08080a;
  }
  .studio-tab {
    padding: 5px 6px; border-radius: 5px; border: 1px solid #27272a; background: #050505;
    color: #a1a1aa; font-size: 10px; font-weight: 700; cursor: pointer; text-align: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .studio-tab:hover { color: #ffffff; border-color: #3f3f46; }
  .studio-tab.active { background: #ffffff; color: #000000; border-color: #ffffff; }
  .studio-panel-card {
    border: 1px solid #2e2e32; border-radius: 6px; background: rgba(5,5,5,0.92);
    padding: 10px; display: flex; flex-direction: column; gap: 8px;
  }
  .scr-row {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 11px; color: #d4d4d8;
  }
  .rs-head {
    padding: 10px 12px; background: #050505; border-bottom: 1px dashed #2e2e32;
    display: flex; align-items: center; justify-content: space-between;
  }
  .rs-output-box {
    padding: 10px 12px; background: #0a0a0c; border-bottom: 1px solid #27272a;
    display: flex; flex-direction: column; gap: 7px;
  }
  .rs-output-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .rs-btn-sec {
    padding: 7px 10px; background: #121215; border: 1px solid #3f3f46; border-radius: 6px;
    color: #fafafa; font-size: 11px; font-weight: 600; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  }
  .rs-btn-sec:hover { border-color: #ffffff; }
  .rs-btn-pri {
    padding: 7px 10px; background: #ffffff; border: 1px solid #ffffff; border-radius: 6px;
    color: #000000; font-size: 11px; font-weight: 700; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  }
  .rs-btn-pri:hover { background: #e4e4e7; }
  .rs-btn-exit {
    padding: 6px 10px; background: #050505; border: 1px solid #3f3f46; border-radius: 6px;
    color: #fca5a5; font-size: 11px; font-weight: 600; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  }
  .rs-btn-exit:hover { border-color: #ef4444; background: #18181b; color: #ffffff; }

  .rs-tabs-bar {
    padding: 8px 12px 0; display: flex; align-items: center; justify-content: space-between; gap: 6px;
  }
  .mcp-sb-tabs {
    display: inline-flex; background: #121215; border: 1px solid #2e2e32; border-radius: 7px; padding: 2px; gap: 2px; flex: 1;
  }
  .mcp-sb-tab {
    flex: 1; padding: 5px 8px; border-radius: 5px; border: none; background: transparent; color: #a1a1aa;
    font-size: 10px; font-weight: 700; cursor: pointer; text-align: center;
  }
  .mcp-sb-tab.active { background: #ffffff; color: #000000; }

  .mcp-sb-empty {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 24px; gap: 8px; color: #a1a1aa;
  }
  .mcp-sb-empty h4 { margin: 0; font-size: 13px; color: #ffffff; }
  .mcp-sb-empty p { margin: 0; font-size: 11px; color: #71717a; line-height: 1.4; }
  .mcp-item { padding: 8px 10px; border-bottom: 1px solid #18181b; display: flex; flex-direction: column; gap: 4px; }
  .mcp-item:last-child { border-bottom: none; }
  .mcp-item-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .mcp-item-sel {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; color: #ffffff;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
  }
  .mcp-item-note { font-size: 10px; color: #a1a1aa; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;class ft{host=null;shadow=null;callbacks;statusInterval=null;statusListener=null;mcpConnected=!1;constructor(t){this.callbacks=t}render(t){(!this.host||!this.shadow)&&(this.host=document.createElement("div"),this.host.id="letme-inspector-overlay-root",this.shadow=this.host.attachShadow({mode:"open"}),document.body.appendChild(this.host),this.startStatusSync());const e=t.layers.find(h=>h.id===t.activeLayerId)||null,i=I.some(h=>h.id===t.activeTool),o=I.find(h=>h.id===t.activeShape)||I[0],n=chrome.runtime.getURL("icons/icon-32.png"),s=t.isToolbarCollapsed?`<button id="btn-expand-tb" class="hud-card hud-toolbar-collapsed"><img src="${n}" alt="LetMe" /><span>LetMe</span><span>▾</span></button>`:`
        <div class="hud-card hud-toolbar">
          <button id="btn-lock-multi" class="tb-btn ${t.multiPick?"active":""}" title="Toggle Multi-Pick (${t.multiPick?"ON":"OFF"})">
            ${f("layers",{size:15})}
          </button>
          <div class="tb-sep"></div>
          <button class="tb-btn ${t.activeTool==="hand"?"active":""}" data-tool="hand" title="Hand / Move & Resize (H)">
            ${lt}<span class="tb-key">H</span>
          </button>
          <button class="tb-btn ${t.activeTool==="pick"?"active":""}" data-tool="pick" title="Pick Element (V)">
            ${f("mouse-pointer-click",{size:15})}<span class="tb-key">V</span>
          </button>
          <div class="tb-sep"></div>
          <button id="btn-shapes-modal" class="tb-btn ${i?"active":""}" title="Select Shape">
            ${o.icon}<span class="tb-key">S</span>
          </button>
          <button class="tb-btn ${t.activeTool==="arrow"?"active":""}" data-tool="arrow" title="Arrow (A)">
            ${f("arrow-right",{size:15})}<span class="tb-key">A</span>
          </button>
          <button class="tb-btn ${t.activeTool==="line"?"active":""}" data-tool="line" title="Line (L)">
            ${f("minus",{size:15})}<span class="tb-key">L</span>
          </button>
          <button class="tb-btn ${t.activeTool==="ruler"?"active":""}" data-tool="ruler" title="Ruler (R)">
            ${f("ruler",{size:15})}<span class="tb-key">R</span>
          </button>
          <button class="tb-btn ${t.activeTool==="pen"?"active":""}" data-tool="pen" title="Draw (B)">
            ${f("pencil",{size:15})}<span class="tb-key">B</span>
          </button>
          <button class="tb-btn ${t.activeTool==="text"?"active":""}" data-tool="text" title="Text (T)">
            ${f("type",{size:15})}<span class="tb-key">T</span>
          </button>
          <button class="tb-btn ${t.activeTool==="sticky"?"active":""}" data-tool="sticky" title="Sticky Note (N)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg><span class="tb-key">N</span>
          </button>
          <button class="tb-btn ${t.activeTool==="blur"?"active":""}" data-tool="blur" title="Censored Blur (U)">
            ${ht}<span class="tb-key">U</span>
          </button>
          <div class="tb-sep"></div>
          <button id="btn-color-modal" class="color-trigger" style="background:${t.activeColor};" title="Pick Color"></button>
          <div class="px-stepper" title="Stroke / Text Size">
            <span class="px-val">${t.activeStrokeWidth}px</span>
            <div class="px-arrows">
              <button id="btn-px-up" class="px-arr-btn" title="Increase px">▲</button>
              <button id="btn-px-down" class="px-arr-btn" title="Decrease px">▼</button>
            </div>
          </div>
          ${t.activeTool==="text"?`<select id="select-font-family" class="font-select" title="Text Font Style">
                  ${K.map(h=>`<option value="${this.escapeHtml(h.value)}" ${t.activeFontFamily===h.value?"selected":""}>${h.label}</option>`).join("")}
                </select>`:""}
          <div class="tb-sep"></div>
          <button id="tb-toggle-pins" class="tb-btn ${t.showAllPins?"active":""}" title="Show/Hide All Layer Pins">
            ${Z}
          </button>
          <button id="tb-undo" class="tb-btn" title="Undo">${f("undo-2",{size:15})}</button>
          <button id="tb-redo" class="tb-btn" title="Redo">${ct}</button>
          <button class="tb-btn danger ${t.activeTool==="eraser"?"active":""}" data-tool="eraser" title="Eraser: Click markup to delete (E)">
            ${dt}<span class="tb-key">E</span>
          </button>
          <button id="tb-clear-all" class="tb-btn danger" title="Clear All Markup on Layer">
            ${f("trash-2",{size:15})}
          </button>
          <button id="btn-collapse-tb" class="tb-btn" title="Hide Toolbar">
            ${f("chevron-up",{size:15})}
          </button>
        </div>
      `;let a="";t.openModal==="shapes"?a=`
        <div class="hud-card tb-popover">
          <div class="pop-title"><span>Select Shape</span><button id="btn-close-modal" class="close-sym">${f("x",{size:12})}</button></div>
          <div class="shapes-grid">
            ${I.map(h=>`<button class="shape-opt ${t.activeShape===h.id?"active":""}" data-shape="${h.id}" title="${h.title}">${h.icon}</button>`).join("")}
          </div>
        </div>
      `:t.openModal==="color"?a=`
        <div class="hud-card tb-popover">
          <div class="pop-title"><span>Color Picker</span><button id="btn-close-modal" class="close-sym">${f("x",{size:12})}</button></div>
          <div class="color-grid">
            ${rt.map(h=>`<button class="color-cell ${t.activeColor.toLowerCase()===h?"active":""}" data-color="${h}" style="background:${h};"></button>`).join("")}
          </div>
          <div class="color-custom-row">
            <input id="input-custom-color" class="color-native" type="color" value="${t.activeColor}" />
            <span>Code:</span>
            <input id="input-hex-color" class="hex-input" type="text" value="${t.activeColor}" maxlength="7" placeholder="#ffffff" />
          </div>
        </div>
      `:t.openModal==="raw"&&(a=`
        <div class="hud-card raw-modal">
          <div class="drawer-head">
            <span class="brand-title">Raw Payload Preview</span>
            <button id="btn-close-modal" class="close-sym">${f("x",{size:12})}</button>
          </div>
          <pre class="raw-pre">${this.escapeHtml(t.rawPreviewText||"No layers picked yet.")}</pre>
        </div>
      `);const r=t.layers.length===0?'<div class="layers-empty">Click any element on the page to add a layer</div>':t.layers.map(h=>{const u=h.id===t.activeLayerId,x=h.thumbnailDataUrl?`<img src="${h.thumbnailDataUrl}" alt="Layer #${h.index}" />`:`<span>#${h.index}</span>`;return`
                <div class="layer-row ${u?"active":""}" data-layer-id="${h.id}">
                  <button class="layer-eye ${h.visible?"":"off"}" data-eye-id="${h.id}" title="Toggle Pin">
                    ${Z}
                  </button>
                  <div class="layer-thumb">${x}</div>
                  <div class="layer-info">
                    <div class="layer-top">
                      <span class="layer-name" style="font-weight:700;">Layer ${h.index}</span>
                      <span class="layer-tag-badge">${h.tag}</span>
                    </div>
                    <div class="layer-sub">
                      <span>&lt;${h.tagName}&gt;</span>
                      <span>· ${h.boxModel.width}×${h.boxModel.height}</span>
                      <span>· ${h.annotations.length} mark</span>
                    </div>
                  </div>
                  <button class="layer-trash" data-copy-id="${h.id}" title="Copy Prompt for Layer ${h.index}">${f("copy",{size:12})}</button>
                  <button class="layer-raw-btn" data-raw-id="${h.id}" title="Preview Raw for Layer ${h.index}">Raw</button>
                  <button class="layer-trash" data-del-id="${h.id}" title="Delete Layer">${f("trash-2",{size:13})}</button>
                </div>
              `}).join("");let l="";if(t.inspectorTab==="layers")l=`
        <div class="section-head">
          <span>Layers (${t.layers.length})</span>
          <span>Click layer to edit</span>
        </div>
        <div class="layers-box">${r}</div>
        <div class="final-notes-wrap">
          <button id="btn-toggle-final-notes" class="final-toggle-btn">
            <span>Additional Final Instructions</span>
            <span>${t.isFinalNotesOpen?"▴":"▾"}</span>
          </button>
          ${t.isFinalNotesOpen?`<textarea id="final-instructions-input" class="note-input" style="min-height:48px;" placeholder="Instruksi tambahan di akhir prompt (opsional)...">${this.escapeHtml(t.finalInstructions)}</textarea>`:""}
        </div>
      `;else if(t.inspectorTab==="scr"){const h=t.screenshots.length===0?'<div class="layers-empty">No screenshots captured yet. Use modes above!</div>':t.screenshots.map(u=>`
                <div class="layer-row">
                  <div class="layer-thumb"><img src="${u.dataUrl}" alt="${u.name}" /></div>
                  <div class="layer-info">
                    <div class="layer-top">
                      <span class="layer-name" style="font-weight:700;">${u.name}</span>
                      <span class="layer-tag-badge">${u.mode}</span>
                    </div>
                    <div class="layer-sub"><span>${u.width}×${u.height}px</span></div>
                  </div>
                  <button class="layer-raw-btn" data-scr-edit="${u.id}" title="Edit / Annotate">Edit</button>
                  <button class="layer-trash" data-scr-copy="${u.id}" title="Copy Image">${f("copy",{size:12})}</button>
                  <button class="layer-trash" data-scr-dl="${u.id}" title="Download">${f("download",{size:12})}</button>
                  <button class="layer-trash" data-scr-send="${u.id}" title="Send to AI">${f("zap",{size:12})}</button>
                  <button class="layer-trash" data-scr-del="${u.id}" title="Delete">${f("trash-2",{size:12})}</button>
                </div>
              `).join("");l=`
        <div class="section-head"><span>Capture Modes</span><span>Pre-markup ready</span></div>
        <div class="studio-panel-card">
          <div class="rs-output-row">
            <button id="btn-scr-area" class="rs-btn-sec">${f("crop",{size:13})} Area Crop</button>
            <button id="btn-scr-full" class="rs-btn-pri">${f("maximize",{size:13,color:"#000000"})} Full View</button>
          </div>
          <div class="rs-output-row">
            <button id="btn-scr-layer" class="rs-btn-sec">${f("layers",{size:13})} Active Layer</button>
            <button id="btn-scr-delay" class="rs-btn-sec">⏱ Delay 3s</button>
          </div>
          <div class="scr-row">
            <span>Include Canvas Markups</span>
            <button id="btn-scr-markup" class="toggle-chip ${t.scrConfig.includeMarkup?"active":""}">${t.scrConfig.includeMarkup?"ON":"OFF"}</button>
          </div>
          <div class="scr-row">
            <span>Hide Studio HUD</span>
            <button id="btn-scr-hidehud" class="toggle-chip ${t.scrConfig.hideHud?"active":""}">${t.scrConfig.hideHud?"ON":"OFF"}</button>
          </div>
          <div class="scr-row">
            <span>Layer Pad / Format / Copy</span>
            <div style="display:flex; gap:4px;">
              <button id="btn-scr-pad" class="toggle-chip">${t.scrConfig.padding}px</button>
              <button id="btn-scr-fmt" class="toggle-chip">${t.scrConfig.format.toUpperCase()}</button>
              <button id="btn-scr-autocopy" class="toggle-chip ${t.scrConfig.autoCopy?"active":""}">Copy</button>
            </div>
          </div>
        </div>
        <div class="section-head"><span>Screenshot Layers (${t.screenshots.length})</span><span>Click Edit to customize</span></div>
        <div class="layers-box">${h}</div>
      `}else l=`
        <div class="section-head"><span>AI Vision Studio</span><span>${this.escapeHtml(t.aiSummary.provider)}</span></div>
        <div class="studio-panel-card">
          <div class="props-meta">
            Provider: <b>${this.escapeHtml(t.aiSummary.provider)}</b><br/>
            Model: <b>${this.escapeHtml(t.aiSummary.model)}</b><br/>
            API Key: <b>${t.aiSummary.hasKey?"Configured":"Not Set (Open Popup Settings)"}</b>
          </div>
          <button id="btn-run-ai-scan" class="rs-btn-pri" style="width:100%;">
            ${f("bot",{size:14,color:"#000000"})} Scan Page with AI Vision
          </button>
        </div>
      `;const d=t.isDrawerOpen?`
        <aside class="hud-card hud-drawer">
          <div class="drawer-head">
            <div class="brand-wrap">
              <img class="brand-logo" src="${n}" alt="LetMe" />
              <span class="brand-title">LetMe Studio</span>
            </div>
            <div style="display:flex; gap:4px; align-items:center;">
              <button id="btn-full-raw" class="toggle-chip" title="Preview Full Prompt">Raw</button>
              <button id="btn-drawer-multi" class="toggle-chip ${t.multiPick?"active":""}">${t.multiPick?"Multi":"Single"}</button>
              <button id="btn-clear-all-layers" class="toggle-chip danger" title="Clear All Layers">${f("trash-2",{size:12})}</button>
            </div>
          </div>
          <div class="studio-tabs">
            <button class="studio-tab ${t.inspectorTab==="layers"?"active":""}" data-ins-tab="layers">Layers</button>
            <button class="studio-tab ${t.inspectorTab==="scr"?"active":""}" data-ins-tab="scr">SCR</button>
            <button class="studio-tab ${t.inspectorTab==="ai"?"active":""}" data-ins-tab="ai">AI Vision</button>
          </div>
          <div class="drawer-body">
            ${l}
          </div>
        </aside>
      `:"",g=t.isDrawerOpen&&t.isPropsOpen&&e?`
        <section class="hud-card hud-props-modal">
          <div class="drawer-head">
            <span class="brand-title">Properties · #${e.index} &lt;${e.tagName}&gt;</span>
            <button id="btn-close-props" class="close-sym" title="Close Properties">${f("x",{size:12})}</button>
          </div>
          <div class="props-body">
            <div class="props-preview">
              ${e.thumbnailDataUrl?`<img src="${e.thumbnailDataUrl}" alt="Preview" />`:"<span>Capturing preview...</span>"}
            </div>
            <div class="props-meta">
              <b>${e.boxModel.width}×${e.boxModel.height}px</b> · Marks: <b>${e.annotations.length}</b><br/>
              Pad: ${e.boxModel.padding.top}/${e.boxModel.padding.right}/${e.boxModel.padding.bottom}/${e.boxModel.padding.left}
              · Mar: ${e.boxModel.margin.top}/${e.boxModel.margin.right}/${e.boxModel.margin.bottom}/${e.boxModel.margin.left}
            </div>
            ${e.layoutBugs.warnings.length>0?`<div class="bug-alert">Alert: ${e.layoutBugs.warnings[0]}</div>`:""}
            <div class="tag-pills">
              ${["bug","design","edit","note"].map(h=>`<button class="tag-pill ${e.tag===h?"active":""}" data-tag="${h}">${h}</button>`).join("")}
            </div>
            <textarea id="layer-note-input" class="note-input" placeholder="Tulis instruksi untuk Layer #${e.index}...">${this.escapeHtml(e.note)}</textarea>
          </div>
        </section>
      `:"",y=t.rightSliderTab==="mcp"?t.mcpSnapshots.length===0?'<div class="mcp-sb-empty"><h4>No MCP data sent yet...</h4><p>Click <b>Send to AI</b> above to dispatch layers to MCP.</p></div>':`<div class="drawer-body"><div class="layers-box">
              ${t.mcpSnapshots.map(h=>`
                  <div class="mcp-item">
                    <div class="mcp-item-top">
                      <span class="mcp-item-sel">&lt;${h.tagName}&gt; ${this.escapeHtml(h.selector)}</span>
                      <button class="layer-trash" data-mcp-del="${h.id}" title="Delete from MCP">${f("trash-2",{size:12})}</button>
                    </div>
                    <div class="mcp-item-note">${this.escapeHtml(h.userInstructions||h.userBugNotes||"No note")}</div>
                  </div>
                `).join("")}
            </div></div>`:t.copyHistory.length===0?'<div class="mcp-sb-empty"><h4>No copy history yet...</h4><p>Click <b>Copy</b> above to generate and save a structured prompt.</p></div>':`<div class="drawer-body"><div class="layers-box">
              ${t.copyHistory.map(h=>`
                  <div class="mcp-item">
                    <div class="mcp-item-top">
                      <span class="mcp-item-sel">${h.layerCount} Layer(s) · ${new Date(h.timestamp).toLocaleTimeString()}</span>
                      <button class="layer-raw-btn" data-hist-copy="${h.id}" title="Copy Again">Copy</button>
                      <button class="layer-trash" data-hist-del="${h.id}" title="Delete">${f("trash-2",{size:12})}</button>
                    </div>
                    <div class="mcp-item-note">${this.escapeHtml(h.summary)}</div>
                  </div>
                `).join("")}
            </div></div>`,p=t.isRightSliderOpen?`
        <aside class="hud-card hud-right-slider">
          <div class="rs-head">
            <span class="brand-title">Right Slider · ${this.mcpConnected?"MCP Online":"MCP Offline"}</span>
            <button id="btn-rs-close" class="close-sym" title="Hide Right Slider">${f("x",{size:12})}</button>
          </div>
          <div class="rs-output-box">
            <div class="section-head"><span>Output</span><span>${t.layers.length} Layer(s)</span></div>
            <div class="rs-output-row">
              <button id="btn-copy" class="rs-btn-sec">${f("copy",{size:12})} Copy</button>
              <button id="btn-send" class="rs-btn-pri">${f("zap",{size:12,color:"#000000"})} Send to AI</button>
            </div>
          </div>
          <div class="rs-tabs-bar">
            <div class="mcp-sb-tabs">
              <button id="tab-rs-mcp" class="mcp-sb-tab ${t.rightSliderTab==="mcp"?"active":""}">MCP (${t.mcpSnapshots.length})</button>
              <button id="tab-rs-history" class="mcp-sb-tab ${t.rightSliderTab==="history"?"active":""}">Copy (${t.copyHistory.length})</button>
            </div>
            ${t.rightSliderTab==="mcp"?'<button id="btn-mcp-refresh" class="toggle-chip" title="Refresh MCP">↻</button>':""}
          </div>
          ${y}
        </aside>
      `:`
        <button id="btn-right-slider" class="hud-card hud-right-toggle" title="Right Slider">
          ${pt}
          ${t.mcpSnapshots.length>0?`<span>${t.mcpSnapshots.length}</span>`:""}
        </button>
      `;this.shadow.innerHTML=`
      <style>${ut}</style>
      <button id="btn-hud-menu" class="hud-card hud-menu-btn ${t.isDrawerOpen?"active":""}" title="Show/Hide Layers">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
      </button>
      ${s}
      ${a}
      ${d}
      ${g}
      ${p}
      <button id="btn-floating-exit" class="hud-exit-fab" title="Close Pick Studio">${f("x",{size:18,color:"#ffffff"})}</button>
    `,this.bindEvents(t)}bindEvents(t){if(!this.shadow)return;this.shadow.getElementById("btn-hud-menu")?.addEventListener("click",()=>this.callbacks.onToggleDrawer()),this.shadow.getElementById("tb-toggle-pins")?.addEventListener("click",()=>this.callbacks.onToggleAllPins()),this.shadow.getElementById("btn-lock-multi")?.addEventListener("click",()=>this.callbacks.onToggleMultiPick()),this.shadow.getElementById("btn-drawer-multi")?.addEventListener("click",()=>this.callbacks.onToggleMultiPick()),this.shadow.getElementById("btn-clear-all-layers")?.addEventListener("click",()=>this.callbacks.onClearAllLayers()),this.shadow.getElementById("btn-full-raw")?.addEventListener("click",()=>this.callbacks.onOpenFullRaw()),this.shadow.getElementById("btn-toggle-final-notes")?.addEventListener("click",()=>this.callbacks.onToggleFinalNotes()),this.shadow.getElementById("btn-collapse-tb")?.addEventListener("click",()=>this.callbacks.onToggleToolbar()),this.shadow.getElementById("btn-expand-tb")?.addEventListener("click",()=>this.callbacks.onToggleToolbar()),this.shadow.getElementById("btn-px-up")?.addEventListener("click",()=>this.callbacks.onSetStrokeWidth(t.activeStrokeWidth+1)),this.shadow.getElementById("btn-px-down")?.addEventListener("click",()=>this.callbacks.onSetStrokeWidth(t.activeStrokeWidth-1)),this.shadow.getElementById("btn-shapes-modal")?.addEventListener("click",()=>this.callbacks.onToggleModal(t.openModal==="shapes"?null:"shapes")),this.shadow.getElementById("btn-color-modal")?.addEventListener("click",()=>this.callbacks.onToggleModal(t.openModal==="color"?null:"color")),this.shadow.getElementById("btn-close-modal")?.addEventListener("click",()=>this.callbacks.onToggleModal(null)),this.shadow.getElementById("btn-close-props")?.addEventListener("click",()=>this.callbacks.onCloseProps()),this.shadow.getElementById("tb-undo")?.addEventListener("click",()=>this.callbacks.onUndo()),this.shadow.getElementById("tb-redo")?.addEventListener("click",()=>this.callbacks.onRedo()),this.shadow.getElementById("tb-clear-all")?.addEventListener("click",()=>this.callbacks.onClearMarkup()),this.shadow.getElementById("btn-right-slider")?.addEventListener("click",()=>this.callbacks.onToggleRightSlider()),this.shadow.getElementById("btn-rs-close")?.addEventListener("click",()=>this.callbacks.onToggleRightSlider()),this.shadow.getElementById("tab-rs-mcp")?.addEventListener("click",()=>this.callbacks.onSwitchRightTab("mcp")),this.shadow.getElementById("tab-rs-history")?.addEventListener("click",()=>this.callbacks.onSwitchRightTab("history")),this.shadow.getElementById("btn-mcp-refresh")?.addEventListener("click",()=>this.callbacks.onRefreshMcpSnapshots()),this.shadow.getElementById("btn-copy")?.addEventListener("click",()=>this.callbacks.onCopyPrompt()),this.shadow.getElementById("btn-send")?.addEventListener("click",()=>this.callbacks.onSendToAi()),this.shadow.getElementById("btn-floating-exit")?.addEventListener("click",()=>this.callbacks.onClose()),this.shadow.getElementById("btn-scr-area")?.addEventListener("click",()=>this.callbacks.onRunScrCapture("area")),this.shadow.getElementById("btn-scr-full")?.addEventListener("click",()=>this.callbacks.onRunScrCapture("full")),this.shadow.getElementById("btn-scr-layer")?.addEventListener("click",()=>this.callbacks.onRunScrCapture("layer")),this.shadow.getElementById("btn-scr-delay")?.addEventListener("click",()=>this.callbacks.onRunScrCapture("delay")),this.shadow.getElementById("btn-scr-markup")?.addEventListener("click",()=>this.callbacks.onToggleScrOption("includeMarkup")),this.shadow.getElementById("btn-scr-hidehud")?.addEventListener("click",()=>this.callbacks.onToggleScrOption("hideHud")),this.shadow.getElementById("btn-scr-autocopy")?.addEventListener("click",()=>this.callbacks.onToggleScrOption("autoCopy")),this.shadow.getElementById("btn-scr-pad")?.addEventListener("click",()=>this.callbacks.onCycleScrPadding()),this.shadow.getElementById("btn-scr-fmt")?.addEventListener("click",()=>this.callbacks.onToggleScrFormat()),this.shadow.getElementById("btn-run-ai-scan")?.addEventListener("click",()=>this.callbacks.onRunAiVisionScan()),this.shadow.querySelectorAll("[data-scr-edit]").forEach(a=>a.addEventListener("click",()=>a.dataset.scrEdit&&this.callbacks.onEditScreenshot(a.dataset.scrEdit))),this.shadow.querySelectorAll("[data-scr-copy]").forEach(a=>a.addEventListener("click",()=>a.dataset.scrCopy&&this.callbacks.onCopyScreenshot(a.dataset.scrCopy))),this.shadow.querySelectorAll("[data-scr-dl]").forEach(a=>a.addEventListener("click",()=>a.dataset.scrDl&&this.callbacks.onDownloadScreenshot(a.dataset.scrDl))),this.shadow.querySelectorAll("[data-scr-send]").forEach(a=>a.addEventListener("click",()=>a.dataset.scrSend&&this.callbacks.onSendScreenshotToAi(a.dataset.scrSend))),this.shadow.querySelectorAll("[data-scr-del]").forEach(a=>a.addEventListener("click",()=>a.dataset.scrDel&&this.callbacks.onDeleteScreenshot(a.dataset.scrDel))),this.shadow.querySelectorAll("[data-ins-tab]").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.insTab;r&&this.callbacks.onSwitchInspectorTab(r)})}),this.shadow.querySelectorAll("[data-tool]").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.tool;r&&this.callbacks.onSetTool(r)})}),this.shadow.querySelectorAll("[data-shape]").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.shape;r&&this.callbacks.onSelectShape(r)})}),this.shadow.querySelectorAll("[data-color]").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.color;r&&this.callbacks.onSetColor(r)})});const e=this.shadow.getElementById("input-custom-color");e?.addEventListener("input",()=>this.callbacks.onSetColor(e.value));const i=this.shadow.getElementById("select-font-family");i?.addEventListener("change",()=>this.callbacks.onSetFontFamily(i.value));const o=this.shadow.getElementById("input-hex-color");o?.addEventListener("input",()=>{const a=o.value.trim();/^#[0-9a-fA-F]{6}$/.test(a)&&this.callbacks.onSetColor(a)}),this.shadow.querySelectorAll("[data-mcp-del]").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.mcpDel;r&&this.callbacks.onDeleteMcpSnapshot(r)})}),this.shadow.querySelectorAll("[data-hist-copy]").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.histCopy;r&&this.callbacks.onRecopyHistoryItem(r)})}),this.shadow.querySelectorAll("[data-hist-del]").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.histDel;r&&this.callbacks.onDeleteHistoryItem(r)})}),this.shadow.querySelectorAll("[data-layer-id]").forEach(a=>{a.addEventListener("click",r=>{const l=r.target;if(l.closest("[data-eye-id]")||l.closest("[data-del-id]")||l.closest("[data-raw-id]")||l.closest("[data-copy-id]"))return;const d=a.dataset.layerId;d&&this.callbacks.onSelectLayer(d)})}),this.shadow.querySelectorAll("[data-copy-id]").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();const l=a.dataset.copyId;l&&this.callbacks.onCopyLayer(l)})}),this.shadow.querySelectorAll("[data-raw-id]").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();const l=a.dataset.rawId;l&&this.callbacks.onOpenLayerRaw(l)})}),this.shadow.querySelectorAll("[data-eye-id]").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();const l=a.dataset.eyeId;l&&this.callbacks.onToggleLayerVisible(l)})}),this.shadow.querySelectorAll("[data-del-id]").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();const l=a.dataset.delId;l&&this.callbacks.onDeleteLayer(l)})}),this.shadow.querySelectorAll("[data-tag]").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.tag;if(r&&this.shadow){const d=this.shadow.querySelector(".layer-row.active")?.dataset.layerId;d&&this.callbacks.onUpdateLayerTag(d,r)}})});const n=this.shadow.getElementById("layer-note-input");n?.addEventListener("input",()=>{const r=this.shadow?.querySelector(".layer-row.active")?.dataset.layerId;r&&this.callbacks.onUpdateLayerNote(r,n.value)});const s=this.shadow.getElementById("final-instructions-input");s?.addEventListener("input",()=>{this.callbacks.onUpdateFinalInstructions(s.value)})}startStatusSync(){const t=e=>{this.mcpConnected=e;const i=this.shadow?.querySelector(".hud-right-slider .brand-title");i&&(i.innerText=`Right Slider · ${e?"MCP Online":"MCP Offline"}`)};chrome.runtime.sendMessage({type:"GET_MCP_STATUS"},e=>t(e?.connected??!1)),this.statusListener=e=>{e.type==="MCP_STATUS_CHANGED"&&t(e.connected??!1)},chrome.runtime.onMessage.addListener(this.statusListener),this.statusInterval=setInterval(()=>{chrome.runtime.sendMessage({type:"GET_MCP_STATUS"},e=>t(e?.connected??!1))},2e3)}escapeHtml(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}showToast(t,e=!1){const i=document.getElementById("letme-toast-msg");i&&i.remove();const o=document.createElement("div");o.id="letme-toast-msg",o.style.cssText=`position:fixed;top:64px;left:50%;transform:translateX(-50%);background:${e?"#18181b":"#050505"};border:1px solid ${e?"#ffffff":"#3f3f46"};color:#fff;padding:7px 14px;border-radius:9999px;z-index:2147483647;font-family:system-ui,sans-serif;font-weight:600;font-size:11px;box-shadow:0 10px 25px rgba(0,0,0,0.75);`,o.innerText=t,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="0",o.style.transition="opacity 0.35s ease",setTimeout(()=>o.remove(),350)},2200)}setHostVisible(t){this.host&&(this.host.style.display=t?"":"none")}remove(){this.statusInterval&&clearInterval(this.statusInterval),this.statusListener&&chrome.runtime.onMessage.removeListener(this.statusListener),this.statusInterval=null,this.statusListener=null,this.host&&(this.host.remove(),this.host=null,this.shadow=null)}}const gt={h:"hand",v:"pick",a:"arrow",l:"line",r:"ruler",b:"pen",t:"text",u:"blur",e:"eraser"};class yt{isActive=!1;hoverOverlay=null;hoverLabel=null;pinElements=new Map;markupStudio=null;overlayUi=null;latestSnapshot=null;layers=[];globalAnnotations=[];activeLayerId=null;activeTool="pick";activeShape="box";activeColor="#ffffff";activeStrokeWidth=2;activeFontFamily=K[3].value;multiPick=!0;isDrawerOpen=!1;isPropsOpen=!1;isToolbarCollapsed=!1;showAllPins=!0;isFinalNotesOpen=!1;openModal=null;rawPreviewText="";finalInstructions="";isRightSliderOpen=!1;rightSliderTab="mcp";inspectorTab="layers";scrConfig={includeMarkup:!0,hideHud:!0,padding:16,format:"png",autoCopy:!0};screenshots=[];scrEditor=new nt;aiSummary={provider:"openrouter",model:"default",hasKey:!1};mcpSnapshots=[];copyHistory=[];mcpListener=null;constructor(){this.overlayUi=new ft({onSelectLayer:t=>{this.switchToLayer(t),this.isPropsOpen=!0,this.layers.find(i=>i.id===t)?.element.scrollIntoView({behavior:"smooth",block:"nearest"}),this.syncPins(),this.renderStudio()},onOpenLayerRaw:t=>{this.rawPreviewText=this.buildLayerRawPreview(t),this.openModal="raw",this.renderStudio()},onCopyLayer:t=>this.handleCopySingleLayer(t),onSwitchInspectorTab:t=>{this.inspectorTab=t,t==="ai"&&this.loadAiSummary(),this.renderStudio()},onRunScrCapture:t=>this.handleStudioScreenshot(t),onToggleScrOption:t=>{this.scrConfig[t]=!this.scrConfig[t],this.renderStudio()},onCycleScrPadding:()=>{const t=[0,16,32];this.scrConfig.padding=t[(t.indexOf(this.scrConfig.padding)+1)%t.length],this.renderStudio()},onToggleScrFormat:()=>{this.scrConfig.format=this.scrConfig.format==="png"?"jpeg":"png",this.renderStudio()},onEditScreenshot:t=>{const e=this.screenshots.find(i=>i.id===t);e&&this.scrEditor.open(e,{onSave:(i,o,n,s,a)=>{const r=this.screenshots.find(l=>l.id===i);r&&(r.dataUrl=o,r.caption=n,r.frame=s,r.annotations=a,this.renderStudio(),this.overlayUi?.showToast(`${r.name} updated!`))},onCopyImage:(i,o,n,s)=>{e.dataUrl=i,e.caption=o,e.frame=n,e.annotations=s,this.renderStudio(),this.copyDataUrlToClipboard(i,o)},onDownload:(i,o)=>this.downloadDataUrl(i,o),onSendToAi:(i,o,n,s)=>{i.dataUrl=o,i.caption=n,i.annotations=s,this.sendScreenshotToMcp(i)}})},onCopyScreenshot:t=>{const e=this.screenshots.find(i=>i.id===t);e&&this.copyDataUrlToClipboard(e.dataUrl,e.caption)},onDownloadScreenshot:t=>{const e=this.screenshots.find(i=>i.id===t);e&&this.downloadDataUrl(e.dataUrl,`${e.name.toLowerCase().replace(/\s+/g,"-")}.${this.scrConfig.format}`)},onSendScreenshotToAi:t=>{const e=this.screenshots.find(i=>i.id===t);e&&this.sendScreenshotToMcp(e)},onDeleteScreenshot:t=>{this.screenshots=this.screenshots.filter(e=>e.id!==t),this.screenshots.forEach((e,i)=>{e.index=i+1,e.name=`SCR ${i+1}`}),this.renderStudio()},onRunAiVisionScan:()=>{this.stop(),F.runDetection()},onOpenFullRaw:()=>{this.rawPreviewText=this.buildStructuredCopyPrompt()||"No layers picked yet.",this.openModal="raw",this.renderStudio()},onDeleteLayer:t=>{this.layers=this.layers.filter(e=>e.id!==t),this.layers.forEach((e,i)=>{e.index=i+1}),this.activeLayerId===t&&(this.activeLayerId=this.layers[0]?.id||null,this.activeLayerId||(this.isPropsOpen=!1),this.loadActiveLayerAnnotations()),this.syncPins(),this.renderStudio()},onClearAllLayers:()=>{this.layers=[],this.activeLayerId=null,this.isPropsOpen=!1,this.globalAnnotations=[],this.markupStudio?.setAnnotations([]),this.syncPins(),this.renderStudio()},onToggleLayerVisible:t=>{const e=this.layers.find(i=>i.id===t);e&&(e.visible=!e.visible,this.syncPins(),this.renderStudio())},onUpdateLayerTag:(t,e)=>{const i=this.layers.find(o=>o.id===t);i&&(i.tag=e,this.syncPins(),this.renderStudio())},onUpdateLayerNote:(t,e)=>{const i=this.layers.find(o=>o.id===t);i&&(i.note=e)},onToggleFinalNotes:()=>{this.isFinalNotesOpen=!this.isFinalNotesOpen,this.renderStudio()},onUpdateFinalInstructions:t=>{this.finalInstructions=t},onCloseProps:()=>{this.isPropsOpen=!1,this.renderStudio()},onSetTool:t=>this.setTool(this.activeTool===t?"idle":t),onSelectShape:t=>{this.activeShape=t,this.openModal=null,this.setTool(t)},onSetColor:t=>{this.activeColor=t,this.markupStudio?.setColor(t),this.renderStudio()},onSetStrokeWidth:t=>{this.activeStrokeWidth=Math.max(1,Math.min(24,t)),this.markupStudio?.setStrokeWidth(this.activeStrokeWidth),this.renderStudio()},onSetFontFamily:t=>{this.activeFontFamily=t,this.markupStudio?.setFontFamily(t),this.renderStudio()},onToggleModal:t=>{this.openModal=t,this.renderStudio()},onUndo:()=>this.markupStudio?.undo(),onRedo:()=>this.markupStudio?.redo(),onClearMarkup:()=>this.markupStudio?.clear(),onToggleMultiPick:()=>{this.multiPick=!this.multiPick,this.renderStudio()},onToggleDrawer:()=>{this.isDrawerOpen=!this.isDrawerOpen,this.renderStudio()},onToggleToolbar:()=>{this.isToolbarCollapsed=!this.isToolbarCollapsed,this.openModal=null,this.renderStudio()},onToggleAllPins:()=>{this.showAllPins=!this.showAllPins,this.syncPins(),this.renderStudio()},onToggleRightSlider:()=>{this.isRightSliderOpen=!this.isRightSliderOpen,this.isRightSliderOpen&&this.refreshMcpSnapshots(),this.renderStudio()},onSwitchRightTab:t=>{this.rightSliderTab=t,this.renderStudio()},onRefreshMcpSnapshots:()=>this.refreshMcpSnapshots(),onDeleteMcpSnapshot:t=>{chrome.runtime.sendMessage({type:"DELETE_MCP_SNAPSHOT",payload:{id:t}},e=>{e?.snapshots&&(this.mcpSnapshots=e.snapshots,this.renderStudio())})},onRecopyHistoryItem:t=>{const e=this.copyHistory.find(i=>i.id===t);e&&(navigator.clipboard.writeText(e.text),this.overlayUi?.showToast("Copied from history!"))},onDeleteHistoryItem:t=>{this.copyHistory=this.copyHistory.filter(e=>e.id!==t),this.renderStudio()},onCopyPrompt:()=>this.handleCopyPrompt(),onSendToAi:()=>this.handleSendToAi(),onClose:()=>this.stop()})}isInspecting(){return this.isActive}getLatestSnapshot(){return this.latestSnapshot}start(){this.isActive||(this.isActive=!0,this.layers=[],this.globalAnnotations=[],this.activeLayerId=null,this.activeTool="pick",this.activeShape="box",this.activeColor="#ffffff",this.activeStrokeWidth=2,this.multiPick=!0,this.isDrawerOpen=!1,this.isPropsOpen=!1,this.isToolbarCollapsed=!1,this.showAllPins=!0,this.isFinalNotesOpen=!1,this.openModal=null,this.rawPreviewText="",this.finalInstructions="",this.isRightSliderOpen=!1,this.createHoverElements(),this.markupStudio?.destroy(),this.markupStudio=new X(window.innerWidth,window.innerHeight),this.markupStudio.setColor(this.activeColor),this.markupStudio.setStrokeWidth(this.activeStrokeWidth),this.markupStudio.setFontFamily(this.activeFontFamily),this.markupStudio.setOnChange(t=>{const e=this.layers.find(i=>i.id===this.activeLayerId);e?e.annotations=t:this.globalAnnotations=t,this.renderStudio()}),document.body.appendChild(this.markupStudio.getCanvasElement()),this.syncCanvasPointerEvents(),this.attachEventListeners(),this.refreshMcpSnapshots(),this.loadAiSummary(),this.renderStudio())}loadAiSummary(){chrome.storage.local.get(["aiProvider","aiModel","aiApiKey"]).then(t=>{const e=t.aiProvider||"openrouter";this.aiSummary={provider:e,model:t.aiModel||"default",hasKey:!!t.aiApiKey||e==="ollama"},this.renderStudio()})}stop(){this.isActive=!1,this.removeHoverElements(),this.clearAllPins(),this.detachEventListeners(),this.markupStudio?.destroy(),this.markupStudio=null,this.scrEditor.close(),this.overlayUi?.remove(),this.layers=[],this.screenshots=[],this.globalAnnotations=[],this.activeLayerId=null}toggle(){this.isActive?this.stop():this.start()}switchToLayer(t){this.activeLayerId=t,this.loadActiveLayerAnnotations()}loadActiveLayerAnnotations(){const t=this.layers.find(e=>e.id===this.activeLayerId);this.markupStudio?.setAnnotations(t?t.annotations:this.globalAnnotations)}setTool(t){this.activeTool=t,this.openModal=null,this.syncCanvasPointerEvents(),t!=="pick"&&this.hoverOverlay&&(this.hoverOverlay.style.display="none"),this.renderStudio()}renderStudio(){this.isActive&&this.overlayUi?.render({layers:this.layers,activeLayerId:this.activeLayerId,activeTool:this.activeTool,activeShape:this.activeShape,activeColor:this.activeColor,activeStrokeWidth:this.activeStrokeWidth,activeFontFamily:this.activeFontFamily,multiPick:this.multiPick,isDrawerOpen:this.isDrawerOpen,isPropsOpen:this.isPropsOpen,isToolbarCollapsed:this.isToolbarCollapsed,showAllPins:this.showAllPins,isFinalNotesOpen:this.isFinalNotesOpen,openModal:this.openModal,rawPreviewText:this.rawPreviewText,finalInstructions:this.finalInstructions,isRightSliderOpen:this.isRightSliderOpen,rightSliderTab:this.rightSliderTab,inspectorTab:this.inspectorTab,scrConfig:this.scrConfig,screenshots:this.screenshots,aiSummary:this.aiSummary,mcpSnapshots:this.mcpSnapshots,copyHistory:this.copyHistory})}syncCanvasPointerEvents(){if(!this.markupStudio)return;const t=this.markupStudio.getCanvasElement();this.activeTool==="pick"||this.activeTool==="idle"?t.style.pointerEvents="none":this.activeTool==="hand"?(t.style.pointerEvents="auto",this.markupStudio.setTool("select")):(t.style.pointerEvents="auto",this.markupStudio.setTool(this.activeTool))}refreshMcpSnapshots(){chrome.runtime.sendMessage({type:"GET_MCP_SNAPSHOTS"},t=>{t?.snapshots&&(this.mcpSnapshots=t.snapshots,this.renderStudio())})}createHoverElements(){this.hoverOverlay||(this.hoverOverlay=document.createElement("div"),this.hoverOverlay.id="letme-hover-overlay",this.hoverOverlay.style.cssText="position:fixed;pointer-events:none;z-index:2147483645;background:rgba(255,255,255,0.08);border:1.5px solid #ffffff;display:none;transition:all 0.05s ease-out;",this.hoverLabel=document.createElement("div"),this.hoverLabel.id="letme-hover-label",this.hoverLabel.style.cssText="position:absolute;top:-22px;left:-1px;background:#050505;color:#fff;border:1px solid #fff;padding:2px 6px;border-radius:3px;font-size:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;white-space:nowrap;width:max-content;line-height:1.1;",this.hoverOverlay.appendChild(this.hoverLabel),document.body.appendChild(this.hoverOverlay))}removeHoverElements(){this.hoverOverlay?.remove(),this.hoverOverlay=null,this.hoverLabel=null}clearAllPins(){this.pinElements.forEach(t=>t.remove()),this.pinElements.clear()}createCornerHandle(t){const e=document.createElement("span");return e.style.cssText="position:absolute;width:6px;height:6px;background:#fff;border:1px solid #050505;box-sizing:border-box;",t.includes("t")&&(e.style.top="-3px"),t.includes("b")&&(e.style.bottom="-3px"),t.includes("l")&&(e.style.left="-3px"),t.includes("r")&&(e.style.right="-3px"),e}syncPins(){if(this.clearAllPins(),!!this.showAllPins)for(const t of this.layers){if(!t.visible)continue;const e=t.element.getBoundingClientRect(),i=t.id===this.activeLayerId,o=document.createElement("div");o.className="letme-layer-pin",o.style.cssText=`position:fixed;box-sizing:border-box;left:${e.left}px;top:${e.top}px;width:${Math.max(2,e.width)}px;height:${Math.max(2,e.height)}px;border:${i?"2px solid #ffffff":"1px dashed rgba(255,255,255,0.8)"};background:${i?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)"};pointer-events:none;z-index:${i?"2147483645":"2147483644"};`,["tl","tr","bl","br"].forEach(s=>o.appendChild(this.createCornerHandle(s)));const n=document.createElement("span");if(n.style.cssText=`position:absolute;left:-1px;${e.top<24?"bottom:-19px;":"top:-19px;"}background:${i?"#ffffff":"#050505"};color:${i?"#000000":"#ffffff"};border:1px solid #ffffff;padding:2px 6px;border-radius:3px;font-size:10px;line-height:1.1;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;width:max-content;`,n.innerText=`#${t.index} ${t.tag.toUpperCase()}`,o.appendChild(n),i){const s=document.createElement("span");s.style.cssText="position:absolute;right:-1px;bottom:-18px;background:#050505;color:#d4d4d8;border:1px solid #3f3f46;padding:1px 5px;border-radius:3px;font-size:9px;line-height:1.1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;width:max-content;",s.innerText=`${Math.round(e.width)}×${Math.round(e.height)}`,o.appendChild(s)}document.body.appendChild(o),this.pinElements.set(t.id,o)}}onReposition=()=>{this.isActive&&this.layers.length>0&&this.syncPins()};attachEventListeners(){document.addEventListener("mousemove",this.onMouseMove,!0),document.addEventListener("click",this.onClick,!0),document.addEventListener("keydown",this.onKeyDown,!0),window.addEventListener("scroll",this.onReposition,!0),window.addEventListener("resize",this.onReposition),this.mcpListener=t=>{t.type==="MCP_SNAPSHOTS_UPDATED"&&(this.mcpSnapshots=t.snapshots||[],this.renderStudio())},chrome.runtime.onMessage.addListener(this.mcpListener)}detachEventListeners(){document.removeEventListener("mousemove",this.onMouseMove,!0),document.removeEventListener("click",this.onClick,!0),document.removeEventListener("keydown",this.onKeyDown,!0),window.removeEventListener("scroll",this.onReposition,!0),window.removeEventListener("resize",this.onReposition),this.mcpListener&&(chrome.runtime.onMessage.removeListener(this.mcpListener),this.mcpListener=null)}onMouseMove=t=>{if(!this.isActive||this.activeTool!=="pick")return;const e=this.getElementFromCursor(t);if(!e||!this.hoverOverlay||!this.hoverLabel){this.hoverOverlay&&(this.hoverOverlay.style.display="none");return}const i=e.getBoundingClientRect();this.hoverOverlay.style.display="block",this.hoverOverlay.style.top=`${i.top}px`,this.hoverOverlay.style.left=`${i.left}px`,this.hoverOverlay.style.width=`${i.width}px`,this.hoverOverlay.style.height=`${i.height}px`;const o=e.tagName.toLowerCase(),n=e.id?`#${e.id}`:"",s=e.classList.length>0?`.${e.classList[0]}`:"";this.hoverLabel.innerText=`<${o}${n}${s}> ${Math.round(i.width)}×${Math.round(i.height)}px`,this.hoverLabel.style.top=i.top<24?"4px":"-22px"};onClick=t=>{if(!this.isActive||this.activeTool!=="pick")return;const e=t.target;if(e.closest('[id^="letme-"]')||e.closest('[class*="letme-"]'))return;t.preventDefault(),t.stopPropagation();const i=this.getElementFromCursor(t);i&&this.addOrSelectElement(i)};onKeyDown=t=>{if(!this.isActive)return;if(t.key==="Escape"){if(this.openModal){this.openModal=null,this.renderStudio();return}this.stop();return}const e=t.composedPath()[0];if(!!e&&(e.tagName==="INPUT"||e.tagName==="TEXTAREA"||e.tagName==="SELECT"||e.isContentEditable)||t.ctrlKey||t.altKey||t.metaKey)return;const o=t.key.toLowerCase();if(o==="s"){t.preventDefault(),this.setTool(this.activeShape);return}const n=gt[o];n&&(t.preventDefault(),this.setTool(n))};getElementFromCursor(t){this.hoverOverlay&&(this.hoverOverlay.style.visibility="hidden");const e=document.elementFromPoint(t.clientX,t.clientY);return this.hoverOverlay&&(this.hoverOverlay.style.visibility="visible"),!e||e===document.body||e===document.documentElement||e.closest('[id^="letme-"]')||e.closest('[class*="letme-"]')?null:e}async captureLayerThumbnail(t,e){try{const o=(await chrome.runtime.sendMessage({type:"CAPTURE_TAB"}))?.dataUrl;if(!o)return;const n=new Image;await new Promise((x,m)=>{n.onload=x,n.onerror=m,n.src=o});const s=n.width/Math.max(1,window.innerWidth),a=8,r=Math.max(0,(e.left-a)*s),l=Math.max(0,(e.top-a)*s),d=Math.min(n.width-r,Math.max(20,(e.width+a*2)*s)),g=Math.min(n.height-l,Math.max(20,(e.height+a*2)*s)),y=document.createElement("canvas"),p=Math.min(1,240/d);y.width=Math.max(1,Math.round(d*p)),y.height=Math.max(1,Math.round(g*p));const h=y.getContext("2d");if(!h)return;h.drawImage(n,r,l,d,g,0,0,y.width,y.height);const u=this.layers.find(x=>x.id===t);u&&(u.thumbnailDataUrl=y.toDataURL("image/jpeg",.85),this.renderStudio())}catch{}}addOrSelectElement(t){const e=this.layers.find(n=>n.element===t);if(e){this.switchToLayer(e.id),this.isDrawerOpen=!0,this.isPropsOpen=!0,this.syncPins(),this.renderStudio();return}this.multiPick||(this.layers=[]);const i=t.getBoundingClientRect(),o={id:`layer_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,index:this.layers.length+1,element:t,selector:O(t),tagName:t.tagName.toLowerCase(),boxModel:H(t),layoutBugs:D(t),tag:"design",note:"",visible:!0,semanticAnchors:this.extractSemanticAnchors(t),annotations:this.layers.length===0?[...this.globalAnnotations]:[]};this.layers.push(o),this.globalAnnotations=[],this.switchToLayer(o.id),this.isDrawerOpen=!0,this.isPropsOpen=!0,this.syncPins(),this.renderStudio(),this.captureLayerThumbnail(o.id,i),this.probeSourceContext(t).then(n=>{if(!n)return;const s=this.layers.find(a=>a.id===o.id);s&&(s.sourceContext=n,this.renderStudio())})}extractSemanticAnchors(t){const e=t.getAttribute("aria-label")?.trim()||void 0,i=t.getAttribute("role")?.trim()||void 0,o=t.getAttribute("data-testid")?.trim()||t.getAttribute("data-test-id")?.trim()||t.getAttribute("data-cy")?.trim()||void 0;let n,s=t,a=0;for(;s&&a<6&&!n;){const r=s.querySelector("h1, h2, h3, h4");if(r?.innerText?.trim()){n=r.innerText.trim().slice(0,80);break}s=s.parentElement,a++}if(!(!e&&!i&&!o&&!n))return{nearestHeading:n,ariaLabel:e,role:i,dataTestId:o}}probeSourceContext(t){return new Promise(e=>{const i=`ltm_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,o=`req_${i}`;let n=!1;const s=()=>{t.removeAttribute("data-letme-probe"),document.removeEventListener("letme-bridge:response",r)},a=setTimeout(()=>{n||(n=!0,s(),e(void 0))},250),r=l=>{const d=l.detail;d?.id!==o||n||(n=!0,clearTimeout(a),s(),e(d.result||void 0))};try{t.setAttribute("data-letme-probe",i),document.addEventListener("letme-bridge:response",r),document.dispatchEvent(new CustomEvent("letme-bridge:request",{detail:{id:o,marker:i}}))}catch{clearTimeout(a),s(),e(void 0)}})}formatAnnotationLine(t,e){const i=t.color?` [${t.color}]`:"",o=t.strokeWidth?` (${t.strokeWidth}px)`:"",n=t.rotation?` [rotated ${Math.round(t.rotation*180/Math.PI)}°]`:"",s=t.type==="text"?`"${t.text||""}"`:t.type==="sticky"?`Sticky Note [${t.stickyTheme||"amber"}]: "${t.text||""}"`:t.type==="ruler"?`Measured ${t.text||"0px"}`:t.type==="blur"?"Censored region":t.text||`${t.type} marker`;return`  ${e+1}. **${t.type.toUpperCase()}**${i}${o}${n}: ${s}`}buildLayerDetailSnapshot(t){const e=t.element;return{index:t.index,tag:t.tag,selector:t.selector,tagName:t.tagName,note:t.note.trim()||void 0,outerHtmlSnippet:j(e),innerTextSnippet:e.innerText?.substring(0,300)||void 0,boxModel:H(e),layoutContext:W(e),layoutBugs:D(e),computedStyles:_(e),sourceContext:t.sourceContext,semanticAnchors:t.semanticAnchors,annotations:t.annotations}}formatLayerPromptSection(t){const e=t.boxModel,i=t.layoutContext,o=[`## Layer #${t.index} — Focus: [${t.tag.toUpperCase()}] \`<${t.tagName}>\` \`${t.selector}\``,`- **User Instruction / Note**: ${t.note||"(no specific note)"}`,`- **Box Model**: ${e.width}×${e.height}px | Margin: ${e.margin.top}/${e.margin.right}/${e.margin.bottom}/${e.margin.left} | Padding: ${e.padding.top}/${e.padding.right}/${e.padding.bottom}/${e.padding.left}`,`- **Parent Context**: \`${i.parentTagName}\` (\`${i.parentSelector}\`, display: \`${i.display}\`, position: \`${i.position}\`)`];if(t.sourceContext){const n=t.sourceContext,s=[`Framework: \`${n.framework}\``];n.componentName&&s.push(`Component: \`${n.componentName}\``),n.ownerChain?.length&&s.push(`Owner Chain: \`${n.ownerChain.join(" -> ")}\``),n.filePath&&s.push(`Source: \`${n.filePath}${n.lineRange?`:${n.lineRange}`:""}\``),o.push(`- **Component & Source Mapping**: ${s.join(" | ")}`)}if(t.semanticAnchors){const n=t.semanticAnchors,s=[];n.nearestHeading&&s.push(`Heading: "${n.nearestHeading}"`),n.ariaLabel&&s.push(`aria-label: "${n.ariaLabel}"`),n.role&&s.push(`role: \`${n.role}\``),n.dataTestId&&s.push(`data-testid: \`${n.dataTestId}\``),s.length>0&&o.push(`- **Semantic Anchors**: ${s.join(" | ")}`)}i.isFlexChild&&i.flexParent&&o.push(`- **Flex Parent**: direction=\`${i.flexParent.flexDirection}\`, justify=\`${i.flexParent.justifyContent}\`, align=\`${i.flexParent.alignItems}\`, gap=\`${i.flexParent.gap}\``),i.isGridChild&&i.gridParent&&o.push(`- **Grid Parent**: cols=\`${i.gridParent.gridTemplateColumns}\`, gap=\`${i.gridParent.gap}\``),t.layoutBugs.warnings.length>0&&o.push(`- **Auto Layout Diagnostics**: ${t.layoutBugs.warnings.join("; ")}`),t.annotations.length>0&&(o.push(`- **Visual Markups (${t.annotations.length})**:`),t.annotations.forEach((n,s)=>o.push(this.formatAnnotationLine(n,s)))),o.push("```html"),o.push(t.outerHtmlSnippet),o.push("```"),o.push("```css");for(const[n,s]of Object.entries(t.computedStyles))o.push(`${n}: ${s};`);return o.push("```"),o.join(`
`)}buildLayerRawPreview(t){const e=this.layers.find(i=>i.id===t);return e?this.formatLayerPromptSection(this.buildLayerDetailSnapshot(e)):"Layer not found."}buildCombinedNotes(){const t=[],e=[];for(const i of this.layers){const o=i.annotations.length>0?` [${i.annotations.length} markup(s)]`:"",n=`#${i.index} [${i.tag.toUpperCase()}] <${i.tagName}> \`${i.selector}\` (${i.boxModel.width}x${i.boxModel.height}px)${o}`,s=i.note.trim()||"(no extra note)";i.tag==="bug"?e.push(`${n}: ${s}`):t.push(`${n}: ${s}`),i.layoutBugs.warnings.length>0&&e.push(`  Auto-detected: ${i.layoutBugs.warnings.join("; ")}`)}return{instructions:t.join(`
`),bugNotes:e.join(`
`)}}buildStructuredCopyPrompt(){if(this.layers.length===0)return"";const t=["# LetMe UI/UX Inspection Prompt",`- **Page**: ${document.title}`,`- **URL**: ${window.location.href}`,`- **Viewport**: ${window.innerWidth}×${window.innerHeight} (DPR ${window.devicePixelRatio||1})`,`- **Total Picked Layers**: ${this.layers.length}`,"",...this.layers.map(e=>this.formatLayerPromptSection(this.buildLayerDetailSnapshot(e)))];return this.finalInstructions.trim()&&(t.push(""),t.push("## Additional Final Instructions"),t.push(this.finalInstructions.trim())),t.join(`
`)}async handleStudioScreenshot(t){let e=null;if(t==="layer"){const i=this.layers.find(s=>s.id===this.activeLayerId)||this.layers[0];if(!i){this.overlayUi?.showToast("Pick a layer first for Active Layer capture.",!0);return}const o=i.element.getBoundingClientRect(),n=this.scrConfig.padding;e=new DOMRect(Math.max(0,o.left-n),Math.max(0,o.top-n),o.width+n*2,o.height+n*2)}else if(t==="area"){if(this.overlayUi?.setHostVisible(!1),e=await A.selectAreaOnly(),this.overlayUi?.setHostVisible(!0),!e)return}else if(t==="delay")for(const i of[3,2,1])this.overlayUi?.showToast(`Capturing in ${i}s...`),await new Promise(o=>setTimeout(o,1e3));this.scrConfig.hideHud&&(this.overlayUi?.setHostVisible(!1),await new Promise(i=>setTimeout(i,60)));try{const o=(await chrome.runtime.sendMessage({type:"CAPTURE_TAB"}))?.dataUrl||"";if(!o)throw new Error("Capture failed");const n=new Image;await new Promise((p,h)=>{n.onload=p,n.onerror=h,n.src=o});const s=n.width/Math.max(1,window.innerWidth),a=document.createElement("canvas");e?(a.width=Math.max(1,Math.round(e.width*s)),a.height=Math.max(1,Math.round(e.height*s))):(a.width=n.width,a.height=n.height);const r=a.getContext("2d");if(e?r.drawImage(n,Math.round(e.left*s),Math.round(e.top*s),Math.round(e.width*s),Math.round(e.height*s),0,0,a.width,a.height):r.drawImage(n,0,0),this.scrConfig.includeMarkup&&this.markupStudio){const p=this.markupStudio.getCanvasElement();e?r.drawImage(p,e.left,e.top,e.width,e.height,0,0,a.width,a.height):r.drawImage(p,0,0,a.width,a.height)}const l=this.scrConfig.format==="jpeg"?"image/jpeg":"image/png",d=a.toDataURL(l,.92),g=this.screenshots.length+1,y={id:`scr_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,index:g,name:`SCR ${g}`,mode:t,dataUrl:d,originalDataUrl:d,width:a.width,height:a.height,timestamp:Date.now(),caption:"",frame:"none"};this.screenshots.push(y),this.scrConfig.autoCopy?await this.copyDataUrlToClipboard(d):this.overlayUi?.showToast(`${y.name} captured!`)}catch(i){this.overlayUi?.showToast(`Screenshot error: ${i.message}`,!0)}finally{this.overlayUi?.setHostVisible(!0),this.renderStudio()}}async copyDataUrlToClipboard(t,e){try{const o=await(await fetch(t)).blob(),n=e?.trim();if(n)try{await navigator.clipboard.write([new ClipboardItem({"image/png":o,"text/plain":new Blob([n],{type:"text/plain"})})]),this.overlayUi?.showToast("Screenshot + caption saved & copied!");return}catch{}await navigator.clipboard.write([new ClipboardItem({"image/png":o})]),this.overlayUi?.showToast("Screenshot copied to clipboard!")}catch{this.overlayUi?.showToast("Saved to SCR list (clipboard unavailable).")}}downloadDataUrl(t,e){const i=document.createElement("a");i.href=t,i.download=e,i.click()}sendScreenshotToMcp(t){const e={id:t.id,timestamp:Date.now(),url:window.location.href,pageTitle:document.title,selector:`screenshot:${t.mode}`,tagName:"screenshot",classNames:[],outerHtmlSnippet:`<!-- ${t.name} (${t.width}x${t.height}px) -->`,boxModel:{width:t.width,height:t.height,margin:{top:0,right:0,bottom:0,left:0},border:{top:0,right:0,bottom:0,left:0},padding:{top:0,right:0,bottom:0,left:0},content:{width:t.width,height:t.height},boundingBox:{x:0,y:0,top:0,right:t.width,bottom:t.height,left:0,width:t.width,height:t.height}},layoutContext:{parentTagName:"viewport",parentSelector:"body",display:"block",position:"static",isFlexChild:!1,isGridChild:!1},layoutBugs:{hasHorizontalScrollLeak:!1,isClippedByAncestor:!1,hasZIndexConflict:!1,zIndex:"auto",warnings:[]},computedStyles:{},screenshotBase64:t.dataUrl,userInstructions:t.caption.trim()||`${t.name} (${t.mode}) captured from LetMe Studio`,annotations:[],viewport:{width:window.innerWidth,height:window.innerHeight,devicePixelRatio:window.devicePixelRatio||1}};chrome.runtime.sendMessage({type:"ELEMENT_CAPTURED",payload:e},i=>{i?.snapshots&&(this.mcpSnapshots=i.snapshots,this.renderStudio())}),this.overlayUi?.showToast(`${t.name} sent to AI via MCP!`)}handleCopySingleLayer(t){const e=this.layers.find(o=>o.id===t);if(!e)return;const i=[`# LetMe Layer ${e.index} Prompt`,`- **Page**: ${document.title}`,`- **URL**: ${window.location.href}`,"",this.formatLayerPromptSection(this.buildLayerDetailSnapshot(e))].join(`
`);navigator.clipboard.writeText(i),this.copyHistory.unshift({id:`copy_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,timestamp:Date.now(),layerCount:1,summary:`Layer ${e.index} <${e.tagName}> [${e.tag.toUpperCase()}]`,text:i}),this.copyHistory.length>20&&this.copyHistory.pop(),this.renderStudio(),this.overlayUi?.showToast(`Layer ${e.index} prompt copied!`)}handleCopyPrompt(){if(this.layers.length===0){this.overlayUi?.showToast("Pick at least 1 element first.",!0);return}const t=this.buildStructuredCopyPrompt();navigator.clipboard.writeText(t);const e=this.layers.map(i=>`#${i.index} <${i.tagName}> [${i.tag.toUpperCase()}]`).join(", ");this.copyHistory.unshift({id:`copy_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,timestamp:Date.now(),layerCount:this.layers.length,summary:e,text:t}),this.copyHistory.length>20&&this.copyHistory.pop(),this.renderStudio(),this.overlayUi?.showToast("Structured prompt copied to clipboard!")}async handleSendToAi(){if(this.layers.length===0||!this.markupStudio){this.overlayUi?.showToast("Pick at least 1 element first.",!0);return}const t=this.layers.find(i=>i.id===this.activeLayerId)||this.layers[0],e=t.element;this.overlayUi?.showToast("Capturing screenshot and analyzing layers...");try{const o=(await chrome.runtime.sendMessage({type:"CAPTURE_TAB"}))?.dataUrl||"",n=t.selector,s=H(e),a=W(e),r=D(e),l=_(e),d=j(e),g=e.innerText?.substring(0,500);let y;if(o){const b=this.layers.length===1?s.boundingBox:void 0;y=await this.markupStudio.exportAnnotatedScreenshot(o,b)}const{instructions:p,bugNotes:h}=this.buildCombinedNotes(),u=this.layers.flatMap(b=>b.annotations),x=this.layers.map(b=>this.buildLayerDetailSnapshot(b)),m={id:`snap_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,timestamp:Date.now(),url:window.location.href,pageTitle:document.title,selector:n,tagName:e.tagName.toLowerCase(),idAttribute:e.id||void 0,classNames:Array.from(e.classList),outerHtmlSnippet:d,innerTextSnippet:g,boxModel:s,layoutContext:a,layoutBugs:r,computedStyles:l,sourceContext:x[0]?.sourceContext,semanticAnchors:x[0]?.semanticAnchors,status:"pending",screenshotBase64:y,userInstructions:p||void 0,userBugNotes:h||void 0,globalInstructions:this.finalInstructions.trim()||void 0,layers:x,annotations:u,viewport:{width:window.innerWidth,height:window.innerHeight,devicePixelRatio:window.devicePixelRatio||1}};this.latestSnapshot=m,chrome.runtime.sendMessage({type:"ELEMENT_CAPTURED",payload:m},b=>{b?.snapshots&&(this.mcpSnapshots=b.snapshots,this.renderStudio())}),this.overlayUi?.showToast(`Sent ${this.layers.length} layer(s) to AI via MCP!`)}catch(i){console.error("[LetMe] Error capturing element:",i),this.overlayUi?.showToast(`Error sending: ${i.message}`,!0)}}}const k=new yt;class mt{activeStyles=new Map;defaultStyleId="letme-live-preview-styles";applyPreview(t,e){try{const i=document.querySelector(t);if(!i)return{success:!1,message:`Element matching selector "${t}" was not found in the DOM.`};let o=this.activeStyles.get(t);o||(o=document.createElement("style"),o.id=`letme-preview-${Date.now()}`,document.head.appendChild(o),this.activeStyles.set(t,o));const n=Object.entries(e).map(([a,r])=>`  ${a}: ${r} !important;`).join(`
`),s=`
/* LetMe AI Live Preview for ${t} */
${t} {
${n}
  outline: 2px dashed #6366f1 !important;
  outline-offset: 2px !important;
  transition: all 0.2s ease-in-out !important;
}
`;return o.textContent=s,i.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"}),{success:!0,message:`Applied ${Object.keys(e).length} CSS rules to ${t}`}}catch(i){return{success:!1,message:i.message||String(i)}}}clearPreview(t){if(t){const e=this.activeStyles.get(t);e&&(e.remove(),this.activeStyles.delete(t))}else{for(const[,e]of this.activeStyles)e.remove();this.activeStyles.clear()}}highlightElement(t,e=3e3){const i=document.querySelector(t);if(!i)return;const o=i.style.outline,n=i.style.outlineOffset;i.style.outline="3px solid #10b981",i.style.outlineOffset="2px",i.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>{i.style.outline=o,i.style.outlineOffset=n},e)}}const N=new mt,B={inspect:"Alt+Shift+I",pickAi:"Alt+Shift+A",screenshot:"Alt+Shift+S",screenshotMode:"area"},z="customShortcuts",J=["Ctrl","Alt","Shift","Meta"],xt=new Set(J);function Q(c){return c.key==="Control"?"Ctrl":c.key==="Alt"?"Alt":c.key==="Shift"?"Shift":c.key==="Meta"?"Meta":c.key==="Escape"?"Escape":c.code?.startsWith("Key")&&c.code.length===4?c.code.slice(3).toUpperCase():c.code?.startsWith("Digit")&&c.code.length===6?c.code.slice(5):c.key===" "?"Space":c.key.length===1?c.key.toUpperCase():c.key}function bt(c){const t=new Set(c),e=[],i=[];for(const s of J)t.has(s)&&e.push(s);for(const s of t)!xt.has(s)&&s!=="Escape"&&i.push(s);i.sort();const o=e.length>=1&&i.length>=1,n=i.length>=2;return!o&&!n?null:[...e,...i].join("+")}function tt(c){return{inspect:c?.inspect||B.inspect,pickAi:c?.pickAi||B.pickAi,screenshot:c?.screenshot||B.screenshot,screenshotMode:c?.screenshotMode==="full"?"full":"area"}}console.log("[LetMe v2] Content script initialized on:",window.location.href);let P={...B};chrome.storage.local.get(z).then(c=>{P=tt(c[z])}),chrome.storage.onChanged.addListener((c,t)=>{t==="local"&&c[z]&&(P=tt(c[z].newValue))});const S=new Set;let L="";window.addEventListener("blur",()=>{S.clear(),L=""}),window.addEventListener("keyup",c=>{const t=Q(c);t&&S.delete(t),S.size===0&&(L="")},!0),window.addEventListener("keydown",c=>{const t=c.target;if(!!t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable)&&!c.altKey&&!c.ctrlKey&&!c.metaKey||c.repeat)return;c.ctrlKey||S.delete("Ctrl"),c.altKey||S.delete("Alt"),c.shiftKey||S.delete("Shift"),c.metaKey||S.delete("Meta");const i=Q(c);if(!i)return;S.add(i);const o=bt(S);!o||o===L||(o===P.inspect?(L=o,c.preventDefault(),c.stopPropagation(),k.toggle()):o===P.pickAi?(L=o,c.preventDefault(),c.stopPropagation(),k.stop(),F.runDetection()):o===P.screenshot&&(L=o,c.preventDefault(),c.stopPropagation(),k.stop(),P.screenshotMode==="full"?A.captureFullPage():A.startAreaCapture()))},!0),chrome.runtime.onMessage.addListener((c,t,e)=>{switch(c.type){case"TOGGLE_INSPECTOR":case"START_INSPECT":return k.toggle(),e({active:k.isInspecting()}),!1;case"START_AUTO_BUG_DETECT":return k.stop(),F.runDetection(),e({success:!0}),!1;case"START_SCREENSHOT_AREA":return k.stop(),A.startAreaCapture(),e({success:!0}),!1;case"START_SCREENSHOT_FULL":return k.stop(),A.captureFullPage(),e({success:!0}),!1;case"GET_STATUS":return chrome.runtime.sendMessage({type:"GET_MCP_STATUS"},i=>{e({inspecting:k.isInspecting(),mcpConnected:i?.connected??!1})}),!0;case"APPLY_CSS_PREVIEW":{const{selector:i,cssRules:o}=c.payload,n=N.applyPreview(i,o);return e(n),!1}case"CLEAR_CSS_PREVIEW":return N.clearPreview(c.payload?.selector),e({success:!0}),!1;case"HIGHLIGHT_ELEMENT":return N.highlightElement(c.payload.selector,c.payload.durationMs),e({success:!0}),!1}return!1});const C=[];function vt(){return[...C]}const wt=console.error,kt=console.warn;return console.error=function(...c){try{const e={type:"error",message:c.map(i=>typeof i=="object"?JSON.stringify(i):String(i)).join(" "),timestamp:Date.now(),stack:new Error().stack};C.push(e),C.length>20&&C.shift(),chrome.runtime.sendMessage({type:"CONSOLE_LOGS",payload:{url:window.location.href,logs:[e]}})}catch{}wt.apply(console,c)},console.warn=function(...c){try{const e={type:"warn",message:c.map(i=>typeof i=="object"?JSON.stringify(i):String(i)).join(" "),timestamp:Date.now()};C.push(e),C.length>20&&C.shift()}catch{}kt.apply(console,c)},R.getRecentConsoleLogs=vt,Object.defineProperty(R,Symbol.toStringTag,{value:"Module"}),R})({});
