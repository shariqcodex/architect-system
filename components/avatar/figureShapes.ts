import type { MuscleId } from "@/lib/types";

// ============================================================================
// Hand-authored, stylized anatomical figure. Each muscle group is one or more
// SVG path strings, plus a centroid used to scale the muscle around its center
// as it ranks up. ViewBox: 0 0 240 470. Figure is centered on x = 120.
// Paired muscles list both left + right paths explicitly (no mirror transform).
// ============================================================================

export interface MuscleShape {
  paths: string[];
  centroid: { x: number; y: number };
}

export const VIEWBOX = "0 0 240 470";

// Dark body silhouette drawn beneath the muscle plates.
export const FRONT_SILHOUETTE =
  "M120 18 C133 18 142 28 142 41 C142 52 136 60 130 64 L132 74 C150 78 162 86 168 100 " +
  "C176 118 178 150 182 188 C184 210 182 226 176 230 C170 226 166 214 162 196 " +
  "C160 214 160 236 158 252 C156 286 150 320 146 350 C144 386 144 410 140 446 " +
  "C138 456 128 456 126 446 C124 420 122 392 120 372 C118 392 116 420 114 446 " +
  "C112 456 102 456 100 446 C96 410 96 386 94 350 C90 320 84 286 82 252 " +
  "C80 236 80 214 78 196 C74 214 70 226 64 230 C58 226 56 210 58 188 " +
  "C62 150 64 118 72 100 C78 86 90 78 108 74 L110 64 C104 60 98 52 98 41 " +
  "C98 28 107 18 120 18 Z";

export const BACK_SILHOUETTE = FRONT_SILHOUETTE; // same outline, different muscle map

const FRONT: Partial<Record<MuscleId, MuscleShape>> = {
  shoulders: {
    paths: [
      "M150 84 C164 84 176 92 180 104 C182 112 178 118 170 116 C160 112 152 104 148 94 C146 88 147 84 150 84 Z",
      "M90 84 C76 84 64 92 60 104 C58 112 62 118 70 116 C80 112 88 104 92 94 C94 88 93 84 90 84 Z",
    ],
    centroid: { x: 120, y: 100 },
  },
  chest: {
    paths: [
      "M122 96 C140 96 156 100 160 112 C162 124 154 132 138 132 C126 132 122 124 122 112 Z",
      "M118 96 C100 96 84 100 80 112 C78 124 86 132 102 132 C114 132 118 124 118 112 Z",
    ],
    centroid: { x: 120, y: 114 },
  },
  biceps: {
    paths: [
      "M166 118 C174 120 178 132 178 150 C178 164 174 172 168 172 C162 170 160 158 160 144 C160 130 161 120 166 118 Z",
      "M74 118 C66 120 62 132 62 150 C62 164 66 172 72 172 C78 170 80 158 80 144 C80 130 79 120 74 118 Z",
    ],
    centroid: { x: 120, y: 146 },
  },
  triceps: {
    paths: [
      "M158 120 C162 122 164 134 164 148 C164 160 161 166 157 164 C154 160 153 150 153 138 C153 128 154 121 158 120 Z",
      "M82 120 C78 122 76 134 76 148 C76 160 79 166 83 164 C86 160 87 150 87 138 C87 128 86 121 82 120 Z",
    ],
    centroid: { x: 120, y: 144 },
  },
  forearms: {
    paths: [
      "M168 176 C176 180 180 196 180 214 C180 226 176 230 170 226 C164 220 162 204 162 190 C162 182 164 176 168 176 Z",
      "M72 176 C64 180 60 196 60 214 C60 226 64 230 70 226 C76 220 78 204 78 190 C78 182 76 176 72 176 Z",
    ],
    centroid: { x: 120, y: 202 },
  },
  core: {
    paths: [
      "M120 136 C134 136 146 142 146 156 C146 184 140 212 120 224 C100 212 94 184 94 156 C94 142 106 136 120 136 Z",
    ],
    centroid: { x: 120, y: 182 },
  },
  quads: {
    paths: [
      "M124 236 C140 236 152 244 152 268 C152 300 146 326 138 344 C132 332 128 308 126 284 C124 264 123 246 124 236 Z",
      "M116 236 C100 236 88 244 88 268 C88 300 94 326 102 344 C108 332 112 308 114 284 C116 264 117 246 116 236 Z",
    ],
    centroid: { x: 120, y: 290 },
  },
  calves: {
    paths: [
      "M134 350 C144 352 148 368 148 388 C148 404 143 414 137 412 C131 406 129 388 129 370 C129 358 130 350 134 350 Z",
      "M106 350 C96 352 92 368 92 388 C92 404 97 414 103 412 C109 406 111 388 111 370 C111 358 110 350 106 350 Z",
    ],
    centroid: { x: 120, y: 382 },
  },
};

const BACK: Partial<Record<MuscleId, MuscleShape>> = {
  shoulders: FRONT.shoulders!,
  triceps: {
    paths: [
      "M166 118 C174 120 178 132 178 150 C178 164 174 172 168 172 C162 170 160 158 160 144 C160 130 161 120 166 118 Z",
      "M74 118 C66 120 62 132 62 150 C62 164 66 172 72 172 C78 170 80 158 80 144 C80 130 79 120 74 118 Z",
    ],
    centroid: { x: 120, y: 146 },
  },
  forearms: FRONT.forearms!,
  back: {
    paths: [
      // upper traps (center)
      "M120 84 C134 84 144 90 144 100 C144 108 134 112 120 112 C106 112 96 108 96 100 C96 90 106 84 120 84 Z",
      // right lat
      "M122 112 C140 112 158 118 160 140 C162 164 152 188 134 200 C128 188 124 168 122 148 Z",
      // left lat
      "M118 112 C100 112 82 118 80 140 C78 164 88 188 106 200 C112 188 116 168 118 148 Z",
    ],
    centroid: { x: 120, y: 150 },
  },
  glutes: {
    paths: [
      "M122 204 C140 204 152 214 152 232 C152 248 142 256 126 256 C123 240 122 222 122 204 Z",
      "M118 204 C100 204 88 214 88 232 C88 248 98 256 114 256 C117 240 118 222 118 204 Z",
    ],
    centroid: { x: 120, y: 230 },
  },
  hamstrings: {
    paths: [
      "M124 258 C140 258 150 266 150 288 C150 314 144 334 136 346 C132 332 128 308 126 284 C124 274 123 264 124 258 Z",
      "M116 258 C100 258 90 266 90 288 C90 314 96 334 104 346 C108 332 112 308 114 284 C116 274 117 264 116 258 Z",
    ],
    centroid: { x: 120, y: 300 },
  },
  calves: FRONT.calves!,
};

export const FIGURE: Record<"front" | "back", Partial<Record<MuscleId, MuscleShape>>> = {
  front: FRONT,
  back: BACK,
};

export const SILHOUETTE: Record<"front" | "back", string> = {
  front: FRONT_SILHOUETTE,
  back: BACK_SILHOUETTE,
};

// Head + neck overlay (non-interactive) for both views.
export const HEAD =
  "M120 18 C133 18 142 28 142 41 C142 52 136 60 130 64 L132 74 L108 74 L110 64 C104 60 98 52 98 41 C98 28 107 18 120 18 Z";
