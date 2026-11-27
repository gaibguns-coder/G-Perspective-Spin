import './portofolio.css';

const tahun = document.getElementById('tahun');
if (tahun) tahun.textContent = String(new Date().getFullYear());
