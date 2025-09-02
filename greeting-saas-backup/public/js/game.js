nano public/js/game.js
``]
- الكود:
```js
function startCollectGame(container, items=6, onWin=()=>{}) {
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.minHeight = '50vh';

  let left = items;
  for (let i=0;i<items;i++){
    const span = document.createElement('span');
    span.textContent = '💖';
    span.style.position='absolute';
    span.style.fontSize = (Math.random()*24+24)+'px';
    span.style.top = Math.random()*80+'%';
    span.style.left = Math.random()*80+'%';
    span.style.cursor='pointer';
    span.addEventListener('click', ()=>{
      span.remove(); left--;
      if(left===0) onWin();
    });
    container.appendChild(span);
  }
}]
- الكود:
```js
function startCollectGame(container, items=6, onWin=()=>{}) {
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.minHeight = '50vh';

  let left = items;
  for (let i=0;i<items;i++){
    const span = document.createElement('span');
    span.textContent = '💖';
    span.style.position='absolute';
        span.remove(); left--;
      if(left===0) onWin();
    });
    container.appendChild(span);
  }
}nano public/index.html


