import React from "react"

import { classNames } from "../infra/functions"

import { PROGRESS_BAR_REFERENCE } from "../components/progressBar"
import Site from "../layout/site"
import Link from "../components/link"

import layout from "../layout/container.module.css"

const FourOhFourPage = () => (
	<Site className="article">
		<main>
			<section
				id={PROGRESS_BAR_REFERENCE}
				{...classNames(layout.container, layout.textContainer)}
			>
				<h1>404</h1>
				<p>Damn, that didn't go as planned. 🤕</p>
				<p>
					I'm terribly sorry this happened and I really hope you can find what you're
					looking for - on this blog, but also in life. It's not easy to achieve your
					goals and broken sites throwing a wrench into your daily business aren't exactly
					helping. But look at the bright side: You're out and about learning about
					Java and that's pretty cool!
				</p>
				<p>
					I'd love to help you as much as I can. If you reach out to me{" "}
					<Link to={"https://twitter.com/nipafx"}>on Twitter</Link> or{" "}
					<Link to={"mailto:foo@bar.de?subject=404 on nipafx.dev&"}>via mail</Link> and
					let me know what you were looking for, I'll find it and get back to you ASAP.
				</p>
			</section>
		</main>
	</Site>
)

export default FourOhFourPage
