FROM node:24-alpine

# install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# make the 'app' folder the current working directory
WORKDIR /app

# copy package.json and package-lock.json (if available)
COPY package*.json ./

# install dependencies
RUN npm install --build-from-source --CXXFLAGS="-std=c++20"

# copy the remainng files
COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]