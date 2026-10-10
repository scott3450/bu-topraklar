import * as THREE from 'three'

// Rüzgâr: ağaç taçlarını gölgelendiricide hafifçe salla (instancing ile de çalışır).
export const windTime = { value: 0 }

export function windify(m: THREE.Material, strength = 0.06) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = windTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 wpos = instanceMatrix[3].xyz;
        #else
          vec3 wpos = vec3(modelMatrix[3].xyz);
        #endif
        float sway = sin(uWind * 1.6 + wpos.x * 0.7 + wpos.z * 0.5) + 0.5 * sin(uWind * 2.9 + wpos.z);
        transformed.x += sway * ${strength.toFixed(3)} * max(position.y + 0.4, 0.0);
        transformed.z += sway * ${(strength * 0.6).toFixed(3)} * max(position.y + 0.4, 0.0);`,
      )
  }
  m.customProgramCacheKey = () => 'wind' + strength
  return m
}
