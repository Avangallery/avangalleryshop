
(() => {
  const art = document.querySelector('#heroArt');
  const title = document.querySelector('#heroTitle');
  const sub = document.querySelector('#heroSubtitle');
  const dots = [...document.querySelectorAll('#sliderDots button')];
  if (!art) return;
  const slides = [
    {img:'assets/watch-hero-1.jpg', title:'MORE THAN<br><span>JUST A WATCH</span>', sub:'انتخابی فراتر از زمان'},
    {img:'assets/watch-hero-2.jpg', title:'TIME<br><span>DEFINES YOUR STYLE</span>', sub:'هر ساعت، بخشی از داستان توست'},
    {img:'assets/watch-hero-3.jpg', title:'ELEGANCE<br><span>IN EVERY SECOND</span>', sub:'جزئیات، تفاوت را ایجاد می‌کند'}
  ];
  let i = 0;
  const show = n => {
    i = (n + slides.length) % slides.length;
    art.style.backgroundImage = `url("${slides[i].img}")`;
    if(title) title.innerHTML = slides[i].title;
    if(sub) sub.textContent = slides[i].sub;
    dots.forEach((d,k)=>d.classList.toggle('active', k===i));
  };
  dots.forEach((d,k)=>d.onclick=()=>show(k));
  document.querySelector('#prevSlide')?.addEventListener('click',()=>show(i-1));
  document.querySelector('#nextSlide')?.addEventListener('click',()=>show(i+1));
  show(0);
  setInterval(()=>show(i+1),3000);
})();
