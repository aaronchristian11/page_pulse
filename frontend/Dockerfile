FROM node:24-alpine

# install simple http server for serving static content
RUN npm install -g http-server

# make the 'app' folder the current working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./

# install the dependencies
RUN npm install

# copy the reamainig files
COPY . .

# build app for production with minification
RUN npm run build

EXPOSE 8080
CMD ["http-server", "dist", "--proxy", "http://backend:3000?"]