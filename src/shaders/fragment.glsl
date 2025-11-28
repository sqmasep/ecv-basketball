uniform float uTime;
uniform float uMouseX;
uniform float uMouseY;

varying vec3 vNormal;

void main(void)
{
  vec3 color = vec3(uMouseX / 1000.0, uMouseY / 1000.0, 1.0);
  gl_FragColor = vec4(color , 1.0);
}