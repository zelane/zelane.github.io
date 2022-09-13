export const cachedGet = async (cache, url, force = false) => {
  // url = encodeURI(url);
  const request = new Request(url, {
    'cache': force === true ? 'reload' : 'default'
  });
  if (force === true) {
    await cache.delete(request);
  }
  let response = await cache.match(request);
  if (!response) {
    await cache.add(request);
    response = await cache.match(request);
  }
  const json = await response.json();
  return json;
  // const resp = await fetch(request);
  // return resp.json();
};

export const post = async (url = '', data = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};


export const _delete = async (url = '', data = {}) => {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};