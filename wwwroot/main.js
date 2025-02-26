import {
  initViewer,
  loadModel,
  setupSelectionHandler,
  setupSelectionHandler2,
  currentDocId,
  loadModel2,
} from "./viewer.js";
import {
  getContents,
  getVersions,
  initTree,
  initTree2,
  renderTree,
} from "./sidebar.js";

const login = document.getElementById("login");
try {
  const resp = await fetch("/api/auth/profile");
  if (resp.ok) {
    const user = await resp.json();
    login.innerText = `Cerrar sesión (${user.name})`;
    login.onclick = () => {
      const iframe = document.createElement("iframe");
      iframe.style.visibility = "hidden";
      iframe.src = "https://accounts.autodesk.com/Authentication/LogOut";
      document.body.appendChild(iframe);
      iframe.onload = () => {
        window.location.replace("/api/auth/logout");
        document.body.removeChild(iframe);
      };
    };
    const viewer = await initViewer(document.getElementById("preview"));
    setupSelectionHandler(viewer);

    setupSelectionHandler2(viewer, (docId) => {
      console.log("El DOC-ID obtenido es:", docId);
    });

    initTree("#tree", viewer, (id) =>
      loadModel(viewer, window.btoa(id).replace(/=/g, ""))
    );

    // Inicializar initTree2 de manera independiente
    const tree2Container = document.getElementById("tree2");
    initTree2("#tree2", (id) => {
      loadModel2(viewer, window.btoa(id).replace(/=/g, ""));
    });

    // Manejador de eventos para los clics en el sidenav
    document
      .getElementById("sidenav")
      .addEventListener("click", async (event) => {
        const target = event.target;
        if (target.classList.contains("nav-header")) {
          const itemId = target.dataset.id;
          if (itemId) {
            // Cargar los datos necesarios para initTree2
            const tokens = itemId.split("|");
            let subItems = [];
            switch (tokens[0]) {
              case "folder":
                subItems = await getContents(tokens[1], tokens[2], tokens[3]);
                break;
              case "item":
                subItems = await getVersions(tokens[1], tokens[2], tokens[3]);
                break;
              default:
                console.log("Tipo de nodo no reconocido:", tokens[0]);
                return;
            }

            // Renderizar los subitems en el árbol
            renderTree({
              container: tree2Container,
              items: subItems,
              viewer: viewer,
            });
          }
        }
      });

    const sidenavToggle = document.getElementById("toggleSidenav");
    const sidenav = document.getElementById("sidenav");
    const preview = document.getElementById("preview");

    sidenavToggle.addEventListener("click", () => {
      sidenav.classList.toggle("active");
      preview.classList.toggle("sidenav-active");

      // Rotar el ícono del botón
      sidenavToggle.style.transform = sidenav.classList.contains("active")
        ? "rotate(180deg)"
        : "rotate(0deg)";
    });

    document.querySelectorAll(".nav-header").forEach((header) => {
      header.addEventListener("click", () => {
        const parent = header.parentElement;
        const isActive = parent.classList.contains("active");

        // Cerrar todos los items
        document.querySelectorAll(".nav-item").forEach((item) => {
          item.classList.remove("active");
        });

        // Abrir solo si no estaba activo
        if (!isActive) {
          parent.classList.add("active");
        }
      });
    });
  } else {
    login.innerText = "Login";
    login.onclick = () => window.location.replace("/api/auth/login");
  }
  login.style.visibility = "visible";
} catch (err) {
  alert("Could not initialize the application. See console for more details.");
  console.error(err);
}
