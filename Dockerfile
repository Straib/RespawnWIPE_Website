FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
# Split to avoid an esbuild postinstall ETXTBSY race in Docker overlay filesystems
RUN npm ci --ignore-scripts
RUN npm rebuild
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
RUN npm rebuild --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
