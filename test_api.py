import urllib.request, json
try:
    # API_URL = "http://localhost:8000/api"

    # Production URL (change this to your actual Render URL)
    API_URL = "https://land-management-api.onrender.com/api"

    req = urllib.request.Request(f'{API_URL}/auth/login', method='POST', data=json.dumps({'email': 'smartland0990@admin.login.com', 'password': 'smartlandbyme@21'}).encode())
    req.add_header('Content-Type', 'application/json')
    req.add_header('Origin', 'https://www.mashorifarm.com')
    res = urllib.request.urlopen(req)
    token = json.loads(res.read().decode())['token']

    req2 = urllib.request.Request(f'{API_URL}/ai/chat', method='POST', data=json.dumps({'message': 'Hello!'}).encode())
    req2.add_header('Content-Type', 'application/json')
    req2.add_header('Authorization', 'Bearer ' + token)
    req2.add_header('Origin', 'https://www.mashorifarm.com')
    res2 = urllib.request.urlopen(req2, timeout=60)
    print('Code:', res2.getcode())
    print('Response:', res2.read().decode())
except Exception as e:
    import builtins
    if hasattr(e, 'read'):
        print('Error:', e, e.read().decode())
    else:
        print('Error:', e)

