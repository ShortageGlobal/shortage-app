import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";

import { addDocumentResponseHeaders } from "./shopify.server";
import getProduct from "./services/GetProduct";

const ABORT_DELAY = 5_000;

export default async function handleRequest(
	request,
	responseStatusCode,
	responseHeaders,
	remixContext,
	_loadContext
) {
	addDocumentResponseHeaders(request, responseHeaders);
	console.log("🚀 ~ request:", request.url)
	
	const callbackName = isbot(request.headers.get("user-agent") || "")
	? "onAllReady"
	: "onShellReady";
	
	
	if(request.url.indexOf('/getPair') > -1){
		const url = new URL(request.url);
		const prodId = url.searchParams.get('prod');
		
		return new Promise((res, rej) => {
			getProduct(prodId).then(result => {
				console.log("🚀 ~ getProduct ~ result:", result);
				res(
					new Response(JSON.stringify(result), {
						headers: { 'Content-Type': 'application/json' },
						status: 200,
					})
				);
			}).catch(error => {
				console.error("Error in getProduct:", error);
				rej(new Response(JSON.stringify({ error: "Product not found" }), {
					headers: { 'Content-Type': 'application/json' },
					status: 404,
				}));
			});
		})
	}
	
	
	
	
	return new Promise((resolve, reject) => {
		const { pipe, abort } = renderToPipeableStream(
			<RemixServer
			context={remixContext}
			url={request.url}
			abortDelay={ABORT_DELAY}
			/>,
			{
				[callbackName]: () => {
					const body = new PassThrough();
					
					responseHeaders.set("Content-Type", "text/html");
					
					resolve(
						new Response(body, {
							headers: responseHeaders,
							status: responseStatusCode,
						})
					);
					
					pipe(body);
				},
				onShellError(error) {
					reject(error);
				},
				onError(error) {
					responseStatusCode = 500;
					console.error(error);
				},
			}
		);
		
		setTimeout(abort, ABORT_DELAY);
	});
}
