const API_PRODUCTS = "https://api.escuelajs.co/api/v1/products";

// Ảnh fallback nội bộ
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='85'%3E%3Crect width='100%25' height='100%25' fill='%23f2f2f2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'%3ENo%20Image%3C/text%3E%3C/svg%3E";

let ALL_PRODUCTS = [];
let currentPage = 1;
let pageSize = 10;

// sort state
let sortBy = null;        // "price" | "title" | null
let sortOrder = "asc";    // "asc" | "desc"

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnReload").addEventListener("click", getAll);

  document.getElementById("searchTitle").addEventListener("input", () => {
    currentPage = 1;
    applyFilterSortPaginateRender();
  });

  document.getElementById("pageSizeSelect").addEventListener("change", (e) => {
    pageSize = Number(e.target.value) || 10;
    currentPage = 1;
    applyFilterSortPaginateRender();
  });

  document.getElementById("btnPrev").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilterSortPaginateRender();
    }
  });

  document.getElementById("btnNext").addEventListener("click", () => {
    const totalPages = getTotalPages(getFilteredAndSorted().length, pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      applyFilterSortPaginateRender();
    }
  });

  // sort buttons
  document.getElementById("btnSortPrice").addEventListener("click", () => {
    toggleSort("price");
  });

  document.getElementById("btnSortTitle").addEventListener("click", () => {
    toggleSort("title");
  });

  // init size
  pageSize = Number(document.getElementById("pageSizeSelect").value) || 10;

  getAll();
});

async function getAll() {
  const statusText = document.getElementById("statusText");
  const tbody = document.getElementById("products-tbody");

  try {
    statusText.textContent = "Đang tải dữ liệu...";
    tbody.innerHTML = "";

    const res = await fetch(API_PRODUCTS, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);

    const products = await res.json();
    ALL_PRODUCTS = Array.isArray(products) ? products : [];

    currentPage = 1;
    applyFilterSortPaginateRender();
  } catch (err) {
    console.error("getAll() error:", err);
    statusText.textContent = "Lỗi tải dữ liệu!";
    alert("Không tải được danh sách sản phẩm!");
  }
}

/** Toggle sort for a field:
 * - click lần 1: asc
 * - click lần 2: desc
 * - click field khác: chuyển field mới về asc
 */
function toggleSort(field) {
  if (sortBy === field) {
    sortOrder = sortOrder === "asc" ? "desc" : "asc";
  } else {
    sortBy = field;
    sortOrder = "asc";
  }

  // cập nhật text nút
  updateSortButtonsUI();

  currentPage = 1;
  applyFilterSortPaginateRender();
}

function updateSortButtonsUI() {
  const btnPrice = document.getElementById("btnSortPrice");
  const btnTitle = document.getElementById("btnSortTitle");

  btnPrice.classList.toggle("active", sortBy === "price");
  btnTitle.classList.toggle("active", sortBy === "title");

  // label hiển thị
  if (sortBy === "price") {
    btnPrice.textContent = sortOrder === "asc" ? "Giá ↑" : "Giá ↓";
  } else {
    btnPrice.textContent = "Giá ↑↓";
  }

  if (sortBy === "title") {
    btnTitle.textContent = sortOrder === "asc" ? "Tên A→Z" : "Tên Z→A";
  } else {
    btnTitle.textContent = "Tên A↔Z";
  }
}

function getFilteredAndSorted() {
  const q = (document.getElementById("searchTitle").value || "")
    .trim()
    .toLowerCase();

  // 1) filter
  let data = ALL_PRODUCTS.filter((p) => {
    const title = String(p?.title ?? "").toLowerCase();
    return title.includes(q);
  });

  // 2) sort (copy để không làm hỏng ALL_PRODUCTS)
  data = [...data];

  if (sortBy === "price") {
    data.sort((a, b) => {
      const pa = Number(a?.price ?? 0);
      const pb = Number(b?.price ?? 0);
      return sortOrder === "asc" ? pa - pb : pb - pa;
    });
  } else if (sortBy === "title") {
    data.sort((a, b) => {
      const ta = String(a?.title ?? "").toLowerCase();
      const tb = String(b?.title ?? "").toLowerCase();
      const cmp = ta.localeCompare(tb);
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }

  return data;
}

function getTotalPages(totalItems, size) {
  const pages = Math.ceil(totalItems / size);
  return pages > 0 ? pages : 1;
}

function applyFilterSortPaginateRender() {
  const statusText = document.getElementById("statusText");
  const pageInfo = document.getElementById("pageInfo");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");

  const filteredSorted = getFilteredAndSorted();
  const totalItems = filteredSorted.length;
  const totalPages = getTotalPages(totalItems, pageSize);

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * pageSize;
  const pageData = filteredSorted.slice(start, start + pageSize);

  renderProductsTable(pageData);

  statusText.textContent = `Hiển thị ${pageData.length} / ${totalItems} (tổng ${ALL_PRODUCTS.length})`;
  pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;

  btnPrev.disabled = currentPage === 1;
  btnNext.disabled = currentPage === totalPages;
}

function renderProductsTable(products) {
  const tbody = document.getElementById("products-tbody");
  if (!tbody) return;

  tbody.innerHTML = products
    .map((p) => {
      const images = Array.isArray(p.images) ? p.images : [];

      const imagesHtml = images
        .map((rawUrl) => {
          const url = sanitizeImageUrl(rawUrl);
          const src = url || PLACEHOLDER_IMG;

          return `
            <div class="img-box">
              <img
                src="${src}"
                alt="${escapeHtml(p.title)}"
                loading="lazy"
                referrerpolicy="no-referrer"
                onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'"
              >
            </div>
          `;
        })
        .join("");

      return `
        <tr>
          <td class="col-id">${p.id}</td>
          <td class="col-title">${escapeHtml(p.title)}</td>
          <td class="col-price">$${Number(p.price).toFixed(2)}</td>
          <td class="col-category">${escapeHtml(p.category?.name || "")}</td>
          <td class="col-images">
            <div class="img-list">${imagesHtml}</div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function sanitizeImageUrl(url) {
  return String(url ?? "")
    .trim()
    .replace(/^["']+|["']+$/g, "");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// cập nhật UI sort ban đầu
document.addEventListener("DOMContentLoaded", updateSortButtonsUI);
