/* RICE Smart prototypes: fits the phone to the frame and keeps the slide's step list in sync (same postMessage protocol as the other decks) */
(function(){
  var embed=/[?&]embed\b/.test(location.search); if(embed)document.documentElement.classList.add('embed');
  var phone=document.querySelector('.phone');
  function fit(){var m=embed?120:90,k=Math.min(innerWidth/(420+m),innerHeight/(916+m),1.6);phone.style.setProperty('--k',k.toFixed(3));}
  addEventListener('resize',fit);fit();
  window.RP={
    $:function(s,r){return (r||document).querySelector(s)},$$:function(s,r){return [].slice.call((r||document).querySelectorAll(s))},
    key:null,steps:{},
    setup:function(key,steps){this.key=key;this.steps=steps;var self=this;
      addEventListener('message',function(e){var d=e.data;if(window.parent===window||e.source!==window.parent||!d||d.arivooProto!==key||!d.goto)return;if(steps[d.goto])steps[d.goto](true);});},
    mark:function(step){if(window.parent!==window)window.parent.postMessage({arivooProto:this.key,step:step},'*');},
    show:function(id){this.$$('.scr').forEach(function(s){s.classList.toggle('on',s.id===id)});},
    toast:function(t){var e=this.$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(this._t);this._t=setTimeout(function(){e.classList.remove('on')},1800);}
  };
})();
