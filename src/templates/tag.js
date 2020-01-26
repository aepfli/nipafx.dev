import React from "react"

import { graphql } from "gatsby"

import Site from "../layout/site"
import Tag from "../layout/tag"

export default ({ pageContext, data }) => {
	const tag = extractTag(pageContext.tag, data.tags.nodes)
	const postSlugs = extractSlugsWithoutSeries(tag, data.posts.nodes)
	const tagOptions = {
		tag: tag.slug,
		postSlugs,
	}
	if (tag.content) tagOptions.descriptionHtmlAst = tag.content.htmlAst
	const meta = {
		title: tag.title,
		slug: tag.slug,
		searchKeywords: pageContext.tag,
	}

	return (
		<Site className="site" meta={meta}>
			<Tag {...tagOptions} />
		</Site>
	)
}

const extractTag = (contextTag, dataTags) =>
	dataTags && dataTags.length > 0
		? dataTags[0]
		: {
				slug: contextTag,
		  }

const extractSlugsWithoutSeries = (tag, posts) => {
	const nonSeriesPosts = tag.series
		? posts.filter(post => !tag.series.includes(post.slug))
		: posts
	return nonSeriesPosts.map(post => post.slug)
}

export const pageQuery = graphql`
	query($tag: String) {
		tags: allTag(filter: { slug: { eq: $tag } }) {
			nodes {
				slug
				title
				series
				content {
					htmlAst
				}
			}
		}
		posts: allPost(
			sort: { fields: [date], order: DESC }
			filter: { tags: { in: [$tag] } }
		) {
			nodes {
				slug
			}
		}
	}
`
