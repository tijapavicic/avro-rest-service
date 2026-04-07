FROM node:20-alpine AS build

WORKDIR /app
COPY sim-engine-frontend/ .

RUN npm install --no-audit --no-fund

EXPOSE 3337

CMD ["npm", "run", "start"]

