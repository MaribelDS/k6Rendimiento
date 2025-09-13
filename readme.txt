Instrucciones de ejecución:

1. Instalar k6 (versión 0.50.0 o superior).
   - Windows: choco install k6
   - Linux/Mac: brew install k6

2. Clonar el repositorio y entrar en la carpeta.

3. Ejecutar la prueba con:
   k6 run script-login.js

4. Los resultados se guardarán automáticamente en la carpeta 'resultados/':
   - summary.json (datos crudos)
   - summary.txt (resumen en texto)
   - summary.html (reporte visual)
