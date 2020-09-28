import React from "react"
import { graphql, useStaticQuery } from "gatsby"
import BackgroundImage from "gatsby-background-image"

import { classNames } from "../infra/functions"
import MarkdownAsHtml from "../infra/markdownAsHtml"

import { Channel, Tag } from "./taglet"
import FormattedDate from "./formattedDate"
import Link from "./link"

import style from "./postCard.module.css"

const PostCard = ({ slug, className }) => {
	const { title, date, channel, tags, description, image } = getPost(slug)
	return (
		<div data-channel={channel} data-tags={tags} {...classNames(style.card, channel, className)}>
			<Link to={slug}>
				<ImageCard image={image}>
					<div className={style.content}>
						<div className={style.cover} />
						<div className={style.details}>
							<div className={style.top}>
								<span className={style.title}><MarkdownAsHtml>{title}</MarkdownAsHtml></span>
								<span className={style.channel}>
									<Channel channel={channel} colorize />
								</span>
								<span className={style.tags}>
									{tags.map(tag => (
										<Tag key={tag} tag={tag} />
									))}
								</span>
							</div>
							<p className={style.description}>
								<MarkdownAsHtml>{description}</MarkdownAsHtml>
								<span className={style.date}>
									<FormattedDate date={date} />
								</span>
							</p>
						</div>
					</div>
				</ImageCard>
			</Link>
		</div>
	)
}

const ImageCard = ({ image, children }) => {
	if (image)
		return (
			<BackgroundImage fluid={image.fluid} className={style.image}>
				{children}
			</BackgroundImage>
		)
	else return <div id={style.image}>{children}</div>
}

const getPost = slug => {
	const { posts, images } = useStaticQuery(graphql`
		query {
			posts: allPost {
				nodes {
					title
					slug
					date
					channel
					tags
					description
					featuredImage
				}
			}
			images: allImageSharp(
				filter: {
					fields: {
						collection: {
							in: ["article-title-images", "course-title-images", "page-title-images", "talk-title-images", "video-title-images"]
						}
					}
				}
			) {
				nodes {
					fields {
						id
					}
					fluid(maxWidth: 800, base64Width: 10, srcSetBreakpoints: [800, 1600], toFormat: JPG, jpegQuality: 40) {
						...GatsbyImageSharpFluid
					}
				}
			}
		}
	`)
	const post = posts.nodes.find(node => node.slug === slug)
	post.image = images.nodes.find(node => node.fields.id === post.featuredImage)
	return post
}

export default PostCard
