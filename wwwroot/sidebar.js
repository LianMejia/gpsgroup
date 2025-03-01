import { loadModel2 } from './viewer.js';

async function getJSON(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    alert('Could not load tree data. See console for more details.');
    console.error(await resp.text());
    return [];
  }
  return resp.json();
}

function createTreeNode(id, text, icon, children = false) {
  return { id, text, children, itree: { icon } };
}

async function getHubs() {
  const hubs = await getJSON('/api/hubs');
  return hubs.map((hub) =>
    createTreeNode(`hub|${hub.id}`, hub.name, 'icon-hub', true)
  );
}

export async function getProjects(hubId) {
  const projects = await getJSON(`/api/hubs/${hubId}/projects`);
  return projects.map((project) =>
    createTreeNode(
      `project|${hubId}|${project.id}`,
      project.name,
      'icon-project',
      true
    )
  );
}

export async function getContents(hubId, projectId, folderId = null) {
  const contents = await getJSON(
    `/api/hubs/${hubId}/projects/${projectId}/contents` +
      (folderId ? `?folder_id=${folderId}` : '')
  );
  return contents.map((item) => {
    if (item.folder) {
      return createTreeNode(
        `folder|${hubId}|${projectId}|${item.id}`,
        item.name,
        'icon-my-folder',
        true
      );
    } else {
      return createTreeNode(
        `item|${hubId}|${projectId}|${item.id}`,
        item.name,
        'icon-item',
        true
      );
    }
  });
}

export async function getContents1(hubId, projectId, folderId = null) {
  const contents = await getJSON(
    `/api/hubs/${hubId}/projects/${projectId}/contents` +
      (folderId ? `?folder_id=${folderId}` : '')
  );
  console.log('contents1', contents);
  return contents.map((item) => {
    if (item.folder) {
      return createTreeNode(
        `folder|${hubId}|${projectId}|${item.id}`,
        item.name,
        'icon-my-folder',
        true
      );
    } else {
      return createTreeNode(
        `item|${hubId}|${projectId}|${item.id}`,
        item.name,
        'icon-item',
        true
      );
    }
  });
}

export async function getVersions(hubId, projectId, itemId) {
  const versions = await getJSON(
    `/api/hubs/${hubId}/projects/${projectId}/contents/${itemId}/versions`
  );
  return versions.map((version) =>
    createTreeNode(
      `version|${version.id}|${version.urn}`,
      version.name,
      'icon-version'
    )
  );
}

function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

export async function renderTree({
  container,
  items,
  level = 0,
  viewer,
  docId,
  renderedIds = new Set(),
}) {
  // Ocultar mensaje de "No hay contenido" si hay items
  if (items.length > 0) {
    const noContentMsg = container.parentElement.querySelector(
      '.no-content-message'
    );
    if (noContentMsg) {
      noContentMsg.style.display = 'none';
    }
  }
  await Promise.all(
    items.map(async (item) => {
      if (renderedIds.has(item.id)) return; // Evitar duplicados
      renderedIds.add(item.id);

      if (item.text.includes(docId)) {
        // Si documento hace match con docId
        const navItem = document.createElement('div');
        navItem.classList.add('nav-item', `level-${level}`);

        const navHeader = document.createElement('div');
        navHeader.classList.add('nav-header');
        navHeader.style.cursor = 'pointer';
        navHeader.dataset.id = item.id;

        // (▶ cerrado, ▼ abierto)
        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = '▶';
        toggleIcon.classList.add('toggle-icon');
        toggleIcon.style.marginRight = '5px';

        // Texto ítem
        const navText = document.createElement('span');
        navText.textContent = item.text;

        // Subcontenedor versiones
        const subContainer = document.createElement('div');
        subContainer.classList.add('nav-subitems');
        subContainer.style.display = 'none';

        // abrir/cerrar menú `navHeader`
        navHeader.addEventListener('click', () => {
          if (subContainer.style.display === 'none') {
            subContainer.style.display = 'block';
            toggleIcon.textContent = '▼'; // Cambiar a expandido
          } else {
            subContainer.style.display = 'none';
            toggleIcon.textContent = '▶'; // Cambiar a colapsado
          }
        });
        navHeader.appendChild(navText);
        navHeader.appendChild(toggleIcon);
        
        navItem.appendChild(navHeader);
        navItem.appendChild(subContainer);
        container.appendChild(navItem);

        // Si es un 'item', obtener versiones
        if (item.id.startsWith('item')) {
          const [_, hubId, projectId, itemId] = item.id.split('|');
          const versions = await getVersions(hubId, projectId, itemId);

          if (versions.length > 0) {
            // Si hay versiones, las agregamos al subContainer
            versions.forEach((version) => {
              console.log('version', version);
              const versionItem = document.createElement('div');
              versionItem.style.cursor = 'pointer';
              versionItem.style.fontSize = 'smaller';
              versionItem.style.color = '#495057';
              versionItem.style.padding = '10px 10px';
              versionItem.style.margin = '4px';
              versionItem.style.display = 'flex'; // Usar flexbox para alinear ícono y texto
              versionItem.style.alignItems = 'center'; // Centrar verticalmente
              versionItem.style.justifyContent = 'space-between'; // Espacio entre texto e ícono
              versionItem.style.borderRadius = '5px';
              versionItem.style.borderBottom = '2px solid #dee2e6';
              versionItem.style.borderLeft = '2px solid #dee2e6';

              // Texto de la versión
              const versionText = document.createElement('span');
              versionText.textContent = `Version: ${version.text}`;

              const fileIcon = document.createElement('span');
              fileIcon.classList.add('material-icons');
              fileIcon.style.marginRight = '8px';
              fileIcon.style.fontSize = '22px';

              // Obtener la extensión del archivo desde el nombre del item
              const extension = getFileExtension(item.text);

              // Asignar ícono según la extensión
              if (extension === 'pdf') {
                fileIcon.textContent = 'picture_as_pdf';
                fileIcon.style.color = '#e53935'; // Rojo para PDF
              } else if (
                ['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension)
              ) {
                fileIcon.textContent = 'image';
                fileIcon.style.color = '#2196F3'; // Azul para imágenes
              } else {
                fileIcon.textContent = 'insert_drive_file'; // Ícono genérico
                fileIcon.style.color = '#6c757d'; // Gris para otros tipos
              }

              versionItem.appendChild(fileIcon);
              versionItem.appendChild(versionText);

              // Evento click para la versión
              versionItem.addEventListener('click', async () => {
                console.log('Versión clickeada:', version);
                const tokens = version.id.split('|');
                if (tokens[0] === 'version') {
                  await loadModel2(
                    viewer,
                    window.btoa(tokens[1]).replace(/=/g, '')
                  );
                }
              });

              // Agregar versionItem al subContainer
              subContainer.appendChild(versionItem);
            });
          } else {
            toggleIcon.style.visibility = 'hidden';
          }
        }

        return; // Detener iteracion si se hace match con docId
      }

      // Si es un folder, seguir buscando dentro de él
      if (item.id.startsWith('folder')) {
        const [_, hubId, projectId, folderId] = item.id.split('|');
        const subItems = await getContents(hubId, projectId, folderId);

        if (subItems.length > 0) {
          await renderTree({
            container,
            items: subItems,
            viewer,
            level,
            docId,
            renderedIds,
          });
        }
      }
    })
  );
}

export let tree2ContainerGlobal = document.getElementById('tree2');
export let result2Global = null;

export function initTree(selector, viewer, onSelectionChanged) {
  // See http://inspire-tree.com
  const tree = new InspireTree({
    data: function (node) {
      if (!node || !node.id) {
        return getHubs();
      } else {
        const tokens = node.id.split('|');
        console.log('tokens', tokens);
        switch (tokens[0]) {
          case 'hub':
            return getProjects(tokens[1]);
          case 'project':
            return getContents(tokens[1], tokens[2]);
          case 'folder':
            return getContents(tokens[1], tokens[2], tokens[3]);
          case 'item':
            return getVersions(tokens[1], tokens[2], tokens[3]);
          default:
            return [];
        }
      }
    },
  });
  function findFolderNode(node) {
    // Verifica si el nodo actual es un folder
    if (node.id && node.id.startsWith('folder')) {
      return node;
    }

    // Si el nodo tiene un parent, sigue buscando
    if (node.itree && node.itree.parent) {
      return findFolderNode(node.itree.parent);
    }

    // Si no se encuentra un folder, retorna null
    return null;
  }
  tree.on('node.click', async function (event, node) {
    event.preventTreeDefault();
    const tokens = node.id.split('|');

    //

    const folderNode = findFolderNode(node);
    console.log('folderNode', folderNode);
    if (folderNode) {
      console.log('Found folder node:', folderNode);
      const folder = folderNode.id.split('|');
      const result = await getContents(folder[1], folder[2], folder[3]);
      console.log('result', result);

      if (result) {
        const documentoCierreObra = result.find((item) =>
          item.text.includes('DOCUMENTACION')
        );

        if (documentoCierreObra) {
          console.log('documentoCierreObra', documentoCierreObra);
          const a = documentoCierreObra.id.split('|');
          const result2 = await getContents(a[1], a[2], a[3]);
          console.log('result2', result2);

          tree2ContainerGlobal = document.getElementById('tree2');
          result2Global = result2;

          console.log('tree2ContainerGlobal', tree2ContainerGlobal);

          /* if (tree2Container) {
            renderTree({
              container: tree2Container,
              items: result2,
              viewer: viewer,
              docId: 'P003'
            });
          } */
        }
      }
    } else {
      console.log('No folder node found');
    }

    //

    if (tokens[0] === 'version') {
      console.log('tokens[0]', tokens[0]);
      onSelectionChanged(tokens[1]);
    }
  });
  return new InspireTreeDOM(tree, { target: selector });
}

let targetFolderId = null;

export function initTree2(selector, onSelectionChanged) {
  console.log('Inicializando initTree2 con selector:', selector);

  // Crear una instancia de InspireTree
  const tree = new InspireTree({
    data: function (node) {
      // Si no hay un nodo seleccionado, no cargar datos iniciales
      if (!node || !node.id) {
        console.log('No hay nodo seleccionado. No cargar datos iniciales.');
        return [];
      }

      // Obtener los tokens del ID del nodo
      const tokens = node.id.split('|');
      console.log('Tokens del nodo:', tokens);

      // Determinar qué datos cargar según el tipo de nodo
      switch (tokens[0]) {
        case 'folder':
          console.log('Cargando contenidos de la carpeta...');
          return getContents(tokens[1], tokens[2], tokens[3]); // Cargar contenidos de la carpeta
        case 'item':
          console.log('Cargando versiones del ítem...');
          return getVersions(tokens[1], tokens[2], tokens[3]); // Cargar versiones del ítem
        default:
          console.log('Tipo de nodo no reconocido:', tokens[0]);
          return [];
      }
    },
  });

  // Manejar el evento de clic en un nodo
  tree.on('node.click', function (event, node) {
    event.preventTreeDefault(); // Evitar el comportamiento por defecto
    const tokens = node.id.split('|');
    console.log('Nodo clickeado:', node);

    // Si el nodo es una versión, ejecutar la lógica correspondiente
    if (tokens[0] === 'version') {
      console.log('Versión clickeada:', tokens[0]);
      onSelectionChanged(tokens[1]); // Llamar a la función de selección
    }
  });

  // Renderizar el árbol en el contenedor especificado
  return new InspireTreeDOM(tree, { target: selector });
}
