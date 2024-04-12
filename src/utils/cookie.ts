export class Cookie {
    static getCookie(cookieName: string): string | null {
        let name = cookieName + "=";

        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');

        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];

            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }

            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }

        return null;
    }

    static setCookie(domain: string, name: string, value: string, date: Date | undefined = undefined) {
        const expires = date ? ";expires=" + date.toUTCString() : "";
        document.cookie = name + "=" + value + expires + ";domain=" + domain + ";path=/";
    }
}
