# Running

Avoiding CORS errors requires serving files with a webserver. For instance,

    docker run --rm --name vacationmap -v $PWD:/usr/share/nginx/html:ro  -p 8080:80 -d nginx
