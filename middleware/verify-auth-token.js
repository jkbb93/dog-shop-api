async function verifyAuthToken(cookie) {
    if (!cookie) throw new Error("User not authenticated");
    const token = cookie.split("token=")[1].split(";")[0];

    const payload = await jwt.verify(token, 'secretkey!!!!');

    return payload.id;
}