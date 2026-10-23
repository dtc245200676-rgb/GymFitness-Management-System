FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --chown=node:node . .
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "start"]
