import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// ✅ Configuración de prueba
export const options = {
  stages: [
    { target: 10, duration: '10s' },
    { target: 10, duration: '60m' },
    { target: 0, duration: '10s' },
  ],
  thresholds: {
    http_req_duration: ['avg <= 60000'],
    http_req_failed: ['rate <= 0.03'],
    iterations: ['rate >= 0.1'],
  },
};

// ✅ Carga de usuarios desde CSV
const users = new SharedArray('usuarios', () => {
  return open('./usuarios.csv')
    .split('\n')
    .slice(1)
    .map(line => {
      const [username, password] = line.trim().split(',');
      return { username, password };
    })
    .filter(user => user.username && user.password);
});

let failedLogins = [];

// ✅ Función principal
export default function () {
  const user = users[Math.floor(Math.random() * users.length)];

  const res = http.post(
    'https://fakestoreapi.com/auth/login',
    JSON.stringify({
      username: user.username,
      password: user.password,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const success = check(res, {
    '🟢 status 201': (r) => r.status === 201,
    '🔐 contiene token': (r) => r.json('token') !== undefined,
    '⏱ duración < 1.5s': (r) => r.timings.duration < 1500,
  });

  if (!success) {
    failedLogins.push({
      username: user.username,
      status: res.status,
      body: res.body,
    });
  }

  sleep(1);
}

// ✅ Reporte personalizado
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2),
    'summary.txt': textSummary(data, { indent: ' ', enableColors: false }),
    'summary.html': htmlReport(data),
    'failed-logins.json': JSON.stringify(failedLogins, null, 2),
  };
}
