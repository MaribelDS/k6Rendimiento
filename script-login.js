import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Cargar usuarios desde el archivo CSV
const users = new SharedArray('usuarios', function () {
  return open('./usuarios.csv')
    .split('\n')
    .slice(1) // quitar encabezado
    .map(line => {
      const [username, password] = line.trim().split(',');
      return { username, password };
    })
    .filter(user => user.username && user.password); // evitar filas vacías
});

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<1500'],   // 95% de requests < 1.5s
    http_req_failed: ['rate<0.03'],      // tasa de error < 3%
  },
  scenarios: {
    login_test: {
      executor: 'constant-arrival-rate',
      rate: 20,              // 20 TPS
      timeUnit: '1s',
      duration: '1m',        // duración de la prueba
      preAllocatedVUs: 50,   // VUs preasignados
      maxVUs: 100,           // límite máximo de VUs
    },
  },
};

export default function () {
  // seleccionar un usuario aleatorio del CSV
  const user = users[Math.floor(Math.random() * users.length)];

  const res = http.post(
    'https://fakestoreapi.com/auth/login',
    JSON.stringify({
      username: user.username,
      password: user.password,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  // Validaciones de respuesta
  check(res, {
    'status es 200': (r) => r.status === 200,
    'respuesta contiene token': (r) => r.json('token') !== undefined,
    'tiempo de respuesta < 1.5s': (r) => r.timings.duration < 1500,
  });

  sleep(1); // pequeña pausa para simular usuario real
}

// Generación de reportes (sin carpeta resultados, todo en raíz)
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2),
    'summary.txt': textSummary(data, { indent: ' ', enableColors: false }),
    'summary.html': htmlReport(data),
  };
}
