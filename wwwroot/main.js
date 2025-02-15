import { initViewer, loadModel } from './viewer.js';
import { initTree } from './sidebar.js';

const login = document.getElementById('login');
try {
    const resp = await fetch('/api/auth/profile');
    if (resp.ok) {
        const user = await resp.json();
        login.innerText = `Cerrar sesión (${user.name})`;
        login.onclick = () => {
            const iframe = document.createElement('iframe');
            iframe.style.visibility = 'hidden';
            iframe.src = 'https://accounts.autodesk.com/Authentication/LogOut';
            document.body.appendChild(iframe);
            iframe.onload = () => {
                window.location.replace('/api/auth/logout');
                document.body.removeChild(iframe);
            };
        }
        const viewer = await initViewer(document.getElementById('preview'));
        initTree('#tree', (id) => loadModel(viewer, window.btoa(id).replace(/=/g, '')));
        const sidenavToggle = document.getElementById('toggleSidenav');
const sidenav = document.getElementById('sidenav');
const preview = document.getElementById('preview');

sidenavToggle.addEventListener('click', () => {
    sidenav.classList.toggle('active');
    preview.classList.toggle('sidenav-active');
    
    // Rotar el ícono del botón
    sidenavToggle.style.transform = sidenav.classList.contains('active') 
        ? 'rotate(180deg)'
        : 'rotate(0deg)';
});

// Cerrar al hacer click fuera
document.addEventListener('click', (e) => {
    if (!sidenav.contains(e.target) && !sidenavToggle.contains(e.target)) {
        sidenav.classList.remove('active');
        preview.classList.remove('sidenav-active');
        sidenavToggle.style.transform = 'rotate(0deg)';
    }
});
    } else {
        login.innerText = 'Login';
        login.onclick = () => window.location.replace('/api/auth/login');
    }
    login.style.visibility = 'visible';
} catch (err) {
    alert('Could not initialize the application. See console for more details.');
    console.error(err);
}
