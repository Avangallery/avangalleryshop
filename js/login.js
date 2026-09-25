(() => {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const authCard = document.getElementById('authCard');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const registerFields = document.getElementById('registerFields');
  const confirmField = document.getElementById('confirmField');
  const submitBtn = document.getElementById('submitBtn');
  const form = document.getElementById('authForm');
  const forgot = document.getElementById('forgot');
  let mode = 'login';

  function setMode(next) {
    mode = next;
    const register = next === 'register';
    loginTab.classList.toggle('active', !register);
    registerTab.classList.toggle('active', register);
    registerFields.hidden = !register;
    confirmField.hidden = !register;
    authCard.classList.toggle('register-mode', register);
    title.textContent = register ? 'ساخت حساب کاربری' : 'ورود به حساب کاربری';
    subtitle.innerHTML = register
      ? 'در آوان گالری ثبت‌نام کنید<br>و خرید خود را سریع‌تر انجام دهید.'
      : 'به آوان گالری خوش آمدید<br>برای دسترسی به حساب خود وارد شوید.';
    submitBtn.textContent = register ? 'ساخت حساب کاربری ←' : 'ورود به حساب کاربری ←';
    forgot.hidden = register;
    const password = form.elements.password;
    password.autocomplete = register ? 'new-password' : 'current-password';
    if (register) authCard.querySelector('.register-fields input').focus();
  }

  loginTab.addEventListener('click', () => setMode('login'));
  registerTab.addEventListener('click', () => setMode('register'));
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (mode === 'register' && form.elements.password.value !== form.elements.confirm.value) {
      form.elements.confirm.setCustomValidity('تکرار رمز عبور یکسان نیست.');
      form.elements.confirm.reportValidity();
      form.elements.confirm.setCustomValidity('');
      return;
    }
    alert(mode === 'register' ? 'فرم ثبت‌نام آماده اتصال به سیستم حساب کاربری است.' : 'فرم ورود آماده اتصال به سیستم حساب کاربری است.');
  });
  forgot.addEventListener('click', e => { e.preventDefault(); alert('بخش بازیابی رمز عبور در مرحله اتصال احراز هویت فعال می‌شود.'); });
  document.getElementById('googleBtn').addEventListener('click', () => alert('ورود با Google در مرحله اتصال OAuth فعال می‌شود.'));
  setMode('login');
})();
