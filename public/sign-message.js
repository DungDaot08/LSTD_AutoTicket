/*
 * JavaScript client-side example using jsrsasign
 */

// #########################################################
// #             WARNING   WARNING   WARNING               #
// #########################################################
// #                                                       #
// # This file is intended for demonstration purposes      #
// # only.                                                 #
// #                                                       #
// # It is the SOLE responsibility of YOU, the programmer  #
// # to prevent against unauthorized access to any signing #
// # functions.                                            #
// #                                                       #
// # Organizations that do not protect against un-         #
// # authorized signing will be black-listed to prevent    #
// # software piracy.                                      #
// #                                                       #
// # -QZ Industries, LLC                                   #
// #                                                       #
// #########################################################

/**
 * Depends:
 *     - jsrsasign-latest-all-min.js
 *     - qz-tray.js
 *
 * Steps:
 *
 *     1. Include jsrsasign 10.9.0 into your web page
 *        <script src="https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/11.1.0/jsrsasign-all-min.js"></script>
 *
 *     2. Update the privateKey below with contents from private-key.pem
 *
 *     3. Include this script into your web page
 *        <script src="path/to/sign-message.js"></script>
 *
 *     4. Remove or comment out any other references to "setSignaturePromise"
 *
 *     5. IMPORTANT: Before deploying to production, copy "jsrsasign-all-min.js"
 *        to the web server.  Don't trust the CDN above to be available.
 */
var privateKey = "-----BEGIN PRIVATE KEY-----\n" +
"MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDF+oWeq7rTK2nu\n" +
"K68VOzRxqk66+loIC0kw7N6haI98NXXSOt+bYepaPOozHBEHMfGUUfS1KKs+UdcY\n" +
"MGjGo702q5TVcL16wkU5SU7nFxN38wAE+urx1rIO+i7xGhac8qXh1bgWPZdCmLOV\n" +
"ToU7HqaPeb53xIEozBkcu4fTqGeuDrua8KaTUocp1UrsAwFlXO0Sv1g+CL2BxBY6\n" +
"jo5KBUiSJe+bUoyrB2dI5EIQnzOHjNl5y8WgyWOfCiYZeK8RIFS5K+YGg7kemmX8\n" +
"LphD/mFOh6pzcLXEZuhwxUBom9lrBoXifE7Ur14sES03fDW3NIg9kR2uzf0yXpUS\n" +
"ieBqv5zfAgMBAAECggEABvrOlCn8w64fpXBv00FLl4hID0p9OxRex7VKIgmkKV5f\n" +
"IYLG2F0K3JSSMywVo5nMqQx8ophk9SUAfs9SGlKyfIdvD1lSrM3Fj//4IqiLHKr6\n" +
"ALLx7oXBsEp8ti5TxsO9OmmE/G++cfAdQLHMe6mYeK1znBhW71/GsN8hqkIhKZ82\n" +
"XHoQK41GgSa9azpxfi/yOSTr8CpCooSUL9hKu2J78qSF4jJ8STh3QAX1LxN3HE1z\n" +
"JKuynu8jRRulk1z2BCawSK3XBfQxVXQpV1Bn3PD7DcmnXuGEaoPeotFyXcsQyOpw\n" +
"jAdEw/qC4yvZACYHMxeD9p+C1Bp3wMsE51EREjb93QKBgQD9kUwDrQGrTDe3fsWq\n" +
"wnsIFPH1HjQ0Ga7HXMEjymx5oQKf7UtHEA/cAZ71iZBBf9lkoxEe6+kCQJSAihoK\n" +
"ha4BGebw0QKWnhs78/CsecVjloJ9lZpV486VwT55QzFmcFB0Ls7q9rUPfMh95mzv\n" +
"0H11fNFYCXbNpRmySbkvicGIHQKBgQDH4LYgT5SbHLAuqLLCpn13Lhgqxg+5rxTX\n" +
"manlhUdyBfimodrmISvmTPQr5McEOg1gGyoxaWTfbjPBs6bzwNQrQDDFJTFwUlmD\n" +
"8qoKcVL5UANGLh+UVjs8SJXhp+N85dsw1vywdPcqGdiX0+jXwRNAYvYDZ0K0NESI\n" +
"HTEK7UjAKwKBgQDcxfYeOTL711enn2wxejUu2zWzysF/H2Fq2Vqcc/GwkLy9TBk/\n" +
"3T9BufOSK1z7enpoQgZ1Gsf8mwfxRszXnn7bHJdT01dilnR15bYGJdv0Eqa4+1mu\n" +
"MLO89c0UPam0XFPgZKTqNTV+L5JM9CSjRK8HbU7ETTEwafCOp9viBRoJDQKBgEbg\n" +
"GNTWQ0TJZHP3IARD00Oalbk9KEBYpBRbidI4c4AsO+KijCOEabOtX/vckPGfwDRv\n" +
"DYQd8kYEJtgt4yqWGuYHSgPuT1yb5uASAVfYnWqIg9Cz9EC+XxzeRD+TL+iO/S2R\n" +
"XmMX5rkIFzSnUO6IqVHwhXnpeM67pf16FHTidSSnAoGBAPb0hL6LAurR7W2uW2gf\n" +
"Xv7gsJrSYf0PUe1+PNyDVDi7wBL6+nIkG55+nqNAT1HENwwndk0Epcg07Qwbw1qp\n" +
"R6J7ixCtUOYde7f2XBSj9WRv7Dg9/GZ2S8zQp0eozTOr4umBJ7vW2BnPHRaWlHuC\n" +
"vz+asH7StgndDFAZiRd5jEv/\n" +
"-----END PRIVATE KEY-----\n" ;

qz.security.setSignatureAlgorithm("SHA512"); // Since 2.1
qz.security.setSignaturePromise(function(toSign) {
    return function(resolve, reject) {
        try {
            var pk = KEYUTIL.getKey(privateKey);
            var sig = new KJUR.crypto.Signature({"alg": "SHA512withRSA"});  // Use "SHA1withRSA" for QZ Tray 2.0 and older
            sig.init(pk); 
            sig.updateString(toSign);
            var hex = sig.sign();
            console.log("DEBUG: \n\n" + stob64(hextorstr(hex)));
            resolve(stob64(hextorstr(hex)));
        } catch (err) {
            console.error(err);
            reject(err);
        }
    };
});
