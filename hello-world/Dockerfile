FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine

#RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/build /usr/share/nginx/html

COPY default.conf /etc/nginx/conf.d/default.conf

#USER appuser

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]  