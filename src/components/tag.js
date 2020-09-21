import React from "react"
import { graphql, useStaticQuery } from "gatsby"

import { classNames } from "../infra/functions"

import Link from "./link"

import style from "./tag.module.css"

export const Tag = ({ tag, link, className }) => {
	className = className || ""
	return (
		<span {...classNames(className, style.tag)}>
			{link ? <Link to={tag}>#{tag}</Link> : `#${tag}`}
		</span>
	)
}

export const Channel = ({ channel, plural, link, className }) => {
	className = className || ""
	const { singularName, pluralName, slug } = channelInfo(channel)
	const name = plural ? pluralName : singularName
	return (
		<span {...classNames(className, style.channel)}>
			{link ? <Link to={slug}>#{name}</Link> : `#${name}`}
		</span>
	)
}

const channelInfo = channel =>
	useStaticQuery(graphql`
		query {
			allChannel {
				channels: nodes {
					internalName
					singularName
					pluralName
					slug
				}
			}
		}
	`).allChannel.channels.find(ch => ch.internalName === channel)
