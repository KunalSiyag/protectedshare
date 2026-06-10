FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY . .
RUN npm ci

FROM base AS build
COPY --from=deps /app /app
RUN npm run build -w @protectedshare/web

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@protectedshare/web"]
