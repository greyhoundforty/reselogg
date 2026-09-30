export type DemGrid = {
  cols: number;
  rows: number;
  west: number;
  south: number;
  east: number;
  north: number;
  cellW: number;
  cellH: number;
  elevations: Float32Array;
};

function lon2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * 2 ** zoom);
}

function lat2tile(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      2 ** zoom,
  );
}

function tile2lon(x: number, zoom: number) {
  return (x / 2 ** zoom) * 360 - 180;
}

function tile2lat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function terrariumMeters(r: number, g: number, b: number) {
  return r * 256 + g + b / 256 - 32768;
}

export const WNC_DEM_BBOX = {
  west: -83.15,
  south: 35.12,
  east: -81.58,
  north: 36.32,
};

export async function loadWncDem(zoom = 8): Promise<DemGrid> {
  const { west, south, east, north } = WNC_DEM_BBOX;
  const x0 = lon2tile(west, zoom);
  const x1 = lon2tile(east, zoom);
  const y0 = lat2tile(north, zoom);
  const y1 = lat2tile(south, zoom);
  const step = 4;
  const tilePx = Math.floor(256 / step);
  const cols = (x1 - x0 + 1) * tilePx;
  const rows = (y1 - y0 + 1) * tilePx;
  const elevations = new Float32Array(cols * rows);

  await Promise.all(
    Array.from({ length: x1 - x0 + 1 }, (_, ix) =>
      Promise.all(
        Array.from({ length: y1 - y0 + 1 }, async (_, iy) => {
          const tx = x0 + ix;
          const ty = y0 + iy;
          const img = await loadTile(zoom, tx, ty);
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (!ctx || !img) return;
          ctx.drawImage(img, 0, 0);
          const { data } = ctx.getImageData(0, 0, 256, 256);
          for (let py = 0; py < tilePx; py++) {
            for (let px = 0; px < tilePx; px++) {
              const sx = px * step;
              const sy = py * step;
              const i = (sy * 256 + sx) * 4;
              const col = ix * tilePx + px;
              const row = iy * tilePx + py;
              elevations[row * cols + col] = terrariumMeters(
                data[i],
                data[i + 1],
                data[i + 2],
              );
            }
          }
        }),
      ),
    ),
  );

  return {
    cols,
    rows,
    west: tile2lon(x0, zoom),
    north: tile2lat(y0, zoom),
    east: tile2lon(x1 + 1, zoom),
    south: tile2lat(y1 + 1, zoom),
    cellW: tilePx,
    cellH: tilePx,
    elevations,
  };
}

async function loadTile(z: number, x: number, y: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `/api/dem/${z}/${x}/${y}`;
  });
}

export type IsoView = {
  yaw: number;
  pitch: number;
  zoom: number;
};

/** Resting camera matches the original NE isometric framing. */
export const DEFAULT_ISO_VIEW: IsoView = {
  yaw: 0,
  pitch: Math.atan((0.42 * Math.SQRT2) / 0.55),
  zoom: 1,
};

export const ISO_PITCH_MIN = 0.28;
export const ISO_PITCH_MAX = 1.32;
export const ISO_ZOOM_MIN = 0.55;
export const ISO_ZOOM_MAX = 3.2;

const ISO_X_COEFF = 0.92 * Math.SQRT2;
const ISO_K = 0.55 / Math.cos(DEFAULT_ISO_VIEW.pitch);

export function clampIsoView(view: IsoView): IsoView {
  return {
    yaw: view.yaw,
    pitch: Math.min(ISO_PITCH_MAX, Math.max(ISO_PITCH_MIN, view.pitch)),
    zoom: Math.min(ISO_ZOOM_MAX, Math.max(ISO_ZOOM_MIN, view.zoom)),
  };
}

export function projectIso(
  grid: DemGrid,
  lat: number,
  lng: number,
  elev: number,
  width: number,
  height: number,
  view: IsoView = DEFAULT_ISO_VIEW,
) {
  const gx = ((lng - grid.west) / (grid.east - grid.west)) * (grid.cols - 1);
  const gy = ((grid.north - lat) / (grid.north - grid.south)) * (grid.rows - 1);
  return gridToIso(gx, gy, elev, grid, width, height, view);
}

function rotateGrid(gx: number, gy: number, grid: DemGrid, view: IsoView) {
  const nx = gx / (grid.cols - 1) - 0.5;
  const ny = gy / (grid.rows - 1) - 0.5;
  const angle = view.yaw + Math.PI / 4;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    rx: nx * c - ny * s,
    rz: nx * s + ny * c,
  };
}

function gridToIso(
  gx: number,
  gy: number,
  elev: number,
  grid: DemGrid,
  width: number,
  height: number,
  view: IsoView = DEFAULT_ISO_VIEW,
) {
  const { rx, rz } = rotateGrid(gx, gy, grid, view);
  const h = elev / 4200;
  const isoX = rx * ISO_X_COEFF;
  const isoY =
    ISO_K * (rz * Math.sin(view.pitch) - h * Math.cos(view.pitch)) + 0.42;
  const scale = Math.min(width, height) * 0.92 * view.zoom;
  return {
    x: width * 0.52 + isoX * scale,
    y: height * 0.18 + isoY * scale,
    depth: rz,
  };
}

export function drawIsometricDem(
  ctx: CanvasRenderingContext2D,
  grid: DemGrid,
  width: number,
  height: number,
  view: IsoView = DEFAULT_ISO_VIEW,
) {
  ctx.clearRect(0, 0, width, height);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#9ec9e8");
  sky.addColorStop(0.45, "#d7e6ef");
  sky.addColorStop(1, "#e7e1d2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const step = 2;
  const angle = view.yaw + Math.PI / 4;
  const colCount = Math.max(0, Math.ceil((grid.cols - step) / step));
  const rowCount = Math.max(0, Math.ceil((grid.rows - step) / step));
  const colRev = Math.sin(angle) < 0;
  const rowRev = Math.cos(angle) < 0;

  for (let ir = 0; ir < rowCount; ir++) {
    const row = (rowRev ? rowCount - 1 - ir : ir) * step;
    for (let ic = 0; ic < colCount; ic++) {
      const col = (colRev ? colCount - 1 - ic : ic) * step;
      const e00 = grid.elevations[row * grid.cols + col];
      const e10 = grid.elevations[row * grid.cols + col + step];
      const e01 = grid.elevations[(row + step) * grid.cols + col];
      const e11 = grid.elevations[(row + step) * grid.cols + col + step];
      if (
        e00 === undefined ||
        e10 === undefined ||
        e01 === undefined ||
        e11 === undefined
      ) {
        continue;
      }
      const p00 = gridToIso(col, row, e00, grid, width, height, view);
      const p10 = gridToIso(col + step, row, e10, grid, width, height, view);
      const p01 = gridToIso(col, row + step, e01, grid, width, height, view);
      const p11 = gridToIso(
        col + step,
        row + step,
        e11,
        grid,
        width,
        height,
        view,
      );
      const slope = e00 - e11;
      ctx.fillStyle = hypso(Math.max(e00, e10, e01, e11), slope);
      ctx.beginPath();
      ctx.moveTo(p00.x, p00.y);
      ctx.lineTo(p10.x, p10.y);
      ctx.lineTo(p11.x, p11.y);
      ctx.lineTo(p01.x, p01.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function hypso(elev: number, slope: number) {
  const shade = Math.max(0.55, Math.min(1.15, 0.88 + slope / 900));
  let r = 90;
  let g = 130;
  let b = 80;
  if (elev < 400) {
    r = 62;
    g = 118;
    b = 78;
  } else if (elev < 800) {
    r = 92;
    g = 138;
    b = 72;
  } else if (elev < 1200) {
    r = 168;
    g = 148;
    b = 78;
  } else if (elev < 1600) {
    r = 150;
    g = 118;
    b = 82;
  } else if (elev < 1900) {
    r = 196;
    g = 186;
    b = 168;
  } else {
    r = 236;
    g = 240;
    b = 242;
  }
  return `rgb(${Math.round(r * shade)}, ${Math.round(g * shade)}, ${Math.round(b * shade)})`;
}

export function sampleElevation(grid: DemGrid, lat: number, lng: number) {
  const gx = ((lng - grid.west) / (grid.east - grid.west)) * (grid.cols - 1);
  const gy = ((grid.north - lat) / (grid.north - grid.south)) * (grid.rows - 1);
  const x = Math.max(0, Math.min(grid.cols - 1, Math.round(gx)));
  const y = Math.max(0, Math.min(grid.rows - 1, Math.round(gy)));
  return grid.elevations[y * grid.cols + x] ?? 700;
}
