# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.base.json vitest.config.ts ./
COPY packages ./packages
COPY apps ./apps

RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps ./apps

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1

CMD ["npm", "run", "start", "-w", "@ai-annotated-review/chatgpt-app-server"]
