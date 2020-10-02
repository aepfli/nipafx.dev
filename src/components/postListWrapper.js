import React from "react"
import { graphql, useStaticQuery } from "gatsby"

import PostList from "./postList"

import layout from "../layout/container.module.css"

const PostListWrapper = ({ kind, slug }) => {
	return (
		<div className={layout.wide}>
			<PostList slugs={getPostSlugs(kind, slug)} />
		</div>
	)
}

const getPostSlugs = (kind, slug) => {
	const { posts, tags } = useStaticQuery(
		graphql`
			query {
				posts: allPost(sort: { fields: date, order: DESC }) {
					nodes {
						slug
						channel
						tags
					}
				}
				tags: allTag {
					nodes {
						slug
						series {
							slug
						}
					}
				}
			}
		`
	)
	switch (kind) {
		// prettier-ignore
		case "channel": return posts.nodes
			.filter(post => post.channel === slug)
			.map(post => post.slug)
		// prettier-ignore
		case "series": return tags.nodes
			.find(tag => tag.slug === slug)
			.series
			// a series can contain `null` to indicate it is ongoing
			.filter(post => post)
			.map(post => post.slug)
		case "tag":
			return extractPostsWithoutSeries(slug, tags.nodes, posts.nodes)
		default:
			throw new Error("Unknown post list type: " + kind)
	}
}

const extractPostsWithoutSeries = (slug, tags, posts) => {
	const richTag = tags.find(tag => tag.slug === slug)
	const tagPosts = posts.filter(post => post.tags.includes(slug))
	const nonSeriesPosts =
		richTag && richTag.series
			? tagPosts.filter(post => !richTag.series.map(post => post.slug).includes(post.slug))
			: tagPosts
	return nonSeriesPosts.map(post => post.slug)
}

export default PostListWrapper
