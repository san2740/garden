const start = document.querySelector('#start');
const status = document.querySelector('#status');
const appleAR = document.querySelector('#apple-ar');
const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (appleMobile) {
  start.addEventListener('click', () => appleAR.click());
  start.disabled = false;
  status.textContent = 'Safari에서 카메라 AR을 시작하고 바닥을 비춰 건물을 배치하세요.';
} else {
  import('./assets/ar-Mqz0T2dt.js?v=studio-1').catch(error => {
    status.textContent = 'AR 프로그램을 불러오지 못했습니다. 새로고침해 주세요.';
    console.error(error);
  });
}
