const path = require(`path`)

exports.sourceNodes = ({ actions, createContentDigest }) => {
	const createRootNode = createCreateRootNode(actions.createNode, createContentDigest)
	createRootNode(`article`, `ArticleCollection`)
	createRootNode(`channel`, `ChannelCollection`)
	createRootNode(`page`, `PageCollection`)
	createRootNode(`post`, `PostCollection`)
	createRootNode(`repo`, `RepoCollection`)
	createRootNode(`tag`, `TagCollection`)
	createRootNode(`video`, `VideoCollection`)
}

const createCreateRootNode = (createNode, createContentDigest) => (id, type) =>
	createRootNode(createNode, id, type, createContentDigest)

const createRootNode = (createNode, id, type, createContentDigest) =>
	createNode({
		id,
		parent: null,
		children: [],
		internal: {
			type,
			content: ``,
			contentDigest: createContentDigest(``),
		},
	})

exports.onCreateNode = ({ node, getNode, actions, createContentDigest }) => {
	const { createNodeField, createNode, deleteNode } = actions

	createFields(node, getNode, createNodeField)

	if (node.internal.type === `MarkdownRemark`) {
		// draft nodes shouldn't show up anywhere during a production build
		if (node.frontmatter.draft) {
			console.warn(
				"Draft: ",
				node.fileAbsolutePath.substring(node.fileAbsolutePath.lastIndexOf("/") + 1)
			)
			if (process.env.NODE_ENV === `production`) {
				deleteNode(node)
				return
			}
		}

		createPostNodes(node, createNode, createContentDigest)
		createArticleNodes(node, createNode, createContentDigest)
		createChannelNodes(node, createNode, createContentDigest)
		createPageNodes(node, createNode, createContentDigest)
		createRepoNodes(node, createNode, createContentDigest)
		createTagNodes(node, createNode, createContentDigest)
		createVideoNodes(node, createNode, createContentDigest)
	}
}

createFields = (node, getNode, createNodeField) => {
	if (![`ImageSharp`, `MarkdownRemark`].includes(node.internal.type)) return

	// add a field `collection` with the source instance (e.g. `articles`),
	// so GraphQL queries can use that information to filter by it
	createNodeField({
		node,
		name: `collection`,
		value: getNode(node.parent).sourceInstanceName,
	})

	// add a field `id` matching the file name, so it can be used to easily identify nodes by file name
	const relative = getNode(node.parent).relativePath
	const file = relative.substring(0, relative.lastIndexOf(`.`)).replace(`/`, `-`)
	createNodeField({
		node,
		name: `id`,
		value: file,
	})
}

exports.createSchemaCustomization = ({ actions }) => {
	const { createTypes } = actions
	// NOTE:
	//  - title, description, and intro can use Markdown syntax!
	//  - linked nodes (see `mapping` in `gatsby-config` must not be part of the schema)
	const typeDefs = `
		type Post implements Node {
			title: String!
			slug: String!
			date: Date! @dateformat
			channel: String!
			tags: [String!]!
			description: String!
			featuredImage: String
		}
		type Article implements Node {
			title: String!
			slug: String!
			date: Date! @dateformat
			tags: [String!]!
			canonicalUrl: String
			canonicalText: String
			description: String!
			intro: String
			searchKeywords: String!
			featuredImage: String
			source: String
		}
		type Channel implements Node {
			title: String!
			internalName: String!
			singularName: String!
			pluralName: String!
			slug: String!
			description: String!
		}
		type Page implements Node {
			title: String!
			slug: String!
			date: Date! @dateformat
			tags: [String!]!
			description: String!
			searchKeywords: String!
			featuredImage: String
		}
		type Repo implements Node {
			title: String!
			slug: String!
			tags: [String!]!
			description: String!
			url: String!
			restrictive: Boolean
		}
		type Tag implements Node {
			title: String!
			slug: String!
			description: String!
			seriesDescription: String
		}
		type Video implements Node {
			title: String!
			slug: String!
			date: Date! @dateformat
			tags: [String!]!
			description: String!
			intro: String
			searchKeywords: String!
			featuredImage: String
			url: String!
		}
	`
	createTypes(typeDefs)
}

createPostNodes = (node, createNode, createContentDigest) => {
	if (![`articles`, `pages`, `videos`].includes(node.fields.collection)) return

	const post = {
		id: `${node.fields.id}-as-post`,

		title: node.frontmatter.title,
		slug: node.frontmatter.slug,
		date: node.frontmatter.date,
		channel: node.fields.collection,
		tags: node.frontmatter.tags,
		description: node.frontmatter.description,
		featuredImage: node.frontmatter.featuredImage,

		parent: `post`,
		children: [],
		internal: {
			type: `Post`,
			content: ``,
			contentDigest: createContentDigest(``),
		},
	}

	createNode(post)
}

createArticleNodes = (node, createNode, createContentDigest) => {
	if (node.fields.collection !== `articles`) return

	const article = {
		id: node.fields.id,

		title: node.frontmatter.title,
		slug: node.frontmatter.slug,
		date: node.frontmatter.date,
		tags: node.frontmatter.tags,
		canonicalUrl: node.frontmatter.canonicalUrl,
		canonicalText: node.frontmatter.canonicalText,
		description: node.frontmatter.description,
		intro: node.frontmatter.intro,
		searchKeywords: node.frontmatter.searchKeywords,
		featuredImage: node.frontmatter.featuredImage,
		repo: node.frontmatter.repo,
		source: node.frontmatter.source,

		// it would be nice to simply assign `node.html`/`node.htmlAst` to a field,
		// but remark creates them later (in setFieldsOnGraphQLNodeType[1]), so they
		// don't exist yet; hooking into that phase seems complicated;
		// the best solution seems to be to refer to the entire node (ugh!) with
		// `___NODE`[2] and query `html` one step removed
		// [1] https://github.com/gatsbyjs/gatsby/issues/6230#issuecomment-401438659
		// [2] https://www.gatsbyjs.org/docs/node-creation/#foreign-key-reference-___node
		content___NODE: node.id,

		parent: `article`,
		children: [],
		internal: {
			type: `Article`,
			content: ``,
			contentDigest: createContentDigest(``),
		},
	}

	createNode(article)
}

createChannelNodes = (node, createNode, createContentDigest) => {
	if (node.fields.collection !== `channels`) return

	const path = node.fileAbsolutePath
	// remove directories and file extension ".md"
	const fileName = path.substring(path.lastIndexOf(`/`) + 1, path.length - 3)

	const channel = {
		id: node.fields.id,

		title: node.frontmatter.title,
		internalName: fileName,
		singularName: node.frontmatter.singularName,
		pluralName: node.frontmatter.pluralName,
		slug: node.frontmatter.slug,
		description: node.frontmatter.description,

		// see comment on creating article nodes
		content___NODE: node.id,

		parent: `channel`,
		children: [],
		internal: {
			type: `Channel`,
			content: ``,
			contentDigest: createContentDigest(``),
		},
	}

	createNode(channel)
}

createPageNodes = (node, createNode, createContentDigest) => {
	if (node.fields.collection !== `pages`) return

	const page = {
		id: node.fields.id,

		title: node.frontmatter.title,
		slug: node.frontmatter.slug,
		date: node.frontmatter.date,
		tags: node.frontmatter.tags,
		description: node.frontmatter.description,
		searchKeywords: node.frontmatter.searchKeywords,

		// see comment on creating article nodes
		content___NODE: node.id,

		parent: `page`,
		children: [],
		internal: {
			type: `Page`,
			content: ``,
			contentDigest: createContentDigest(``),
		},
	}

	createNode(page)
}

createRepoNodes = (node, createNode, createContentDigest) => {
	if (node.fields.collection !== `repos`) return

	const repo = {
		id: node.fields.id,

		title: node.frontmatter.title,
		slug: node.frontmatter.slug,
		tags: node.frontmatter.tags,
		description: node.frontmatter.description,
		url: node.frontmatter.url,

		parent: `repo`,
		children: [],
		internal: {
			type: `Repo`,
			content: ``,
			contentDigest: createContentDigest(``),
		},
	}

	createNode(repo)
}

createTagNodes = (node, createNode, createContentDigest) => {
	if (node.fields.collection !== `tags`) return

	const tag = {
		id: node.fields.id,

		title: node.frontmatter.title,
		slug: node.frontmatter.slug,
		description: node.frontmatter.description,
		series: node.frontmatter.series,
		seriesDescription: node.frontmatter.seriesDescription,

		// see comment on creating article nodes
		content___NODE: node.id,

		parent: `tag`,
		children: [],
		internal: {
			type: `Tag`,
			content: ``,
			contentDigest: createContentDigest(``),
		},
	}

	createNode(tag)
}

createVideoNodes = (node, createNode, createContentDigest) => {
	if (node.fields.collection !== `videos`) return

	const video = {
		id: node.fields.id,

		title: node.frontmatter.title,
		slug: node.frontmatter.slug,
		date: node.frontmatter.date,
		tags: node.frontmatter.tags,
		description: node.frontmatter.description,
		intro: node.frontmatter.intro,
		searchKeywords: node.frontmatter.searchKeywords,
		repo: node.frontmatter.repo,
		url: node.frontmatter.url,

		// see comment on creating article nodes
		content___NODE: node.id,

		parent: `video`,
		children: [],
		internal: {
			type: `Video`,
			content: ``,
			contentDigest: createContentDigest(``),
		},
	}

	createNode(video)
}

exports.createPages = ({ graphql, actions }) => {
	const { createPage } = actions

	return Promise.all([
		createArticlePages(graphql, createPage),
		createChannelPages(graphql, createPage),
		createPagePages(graphql, createPage),
		createTagPages(graphql, createPage),
		createVideoPages(graphql, createPage),
	])
}

createArticlePages = (graphql, createPage) => {
	const articleTemplate = path.resolve(`./src/templates/article.js`)

	return graphql(`
		{
			articles: allArticle {
				nodes {
					slug
				}
			}
		}
	`).then(({ data }) => {
		data.articles.nodes.forEach(article => {
			createPage({
				path: article.slug,
				component: articleTemplate,
				context: {
					slug: article.slug,
				},
			})
		})
	})
}

createChannelPages = (graphql, createPage) => {
	const pageTemplate = path.resolve(`./src/templates/channel.js`)

	return graphql(`
		{
			channels: allChannel {
				nodes {
					internalName
					slug
				}
			}
		}
	`).then(({ data }) => {
		data.channels.nodes.forEach(channel => {
			createPage({
				path: channel.slug,
				component: pageTemplate,
				context: {
					channel: channel.internalName,
				},
			})
		})
	})
}

createPagePages = (graphql, createPage) => {
	const pageTemplate = path.resolve(`./src/templates/page.js`)

	return graphql(`
		{
			pages: allPage {
				nodes {
					slug
				}
			}
		}
	`).then(({ data }) => {
		data.pages.nodes.forEach(page => {
			createPage({
				path: page.slug,
				component: pageTemplate,
				context: {
					slug: page.slug,
				},
			})
		})
	})
}

createTagPages = (graphql, createPage) => {
	const tagTemplate = path.resolve(`./src/templates/tag.js`)

	return graphql(`
		{
			tags: allPost {
				group(field: tags) {
					name: fieldValue
				}
			}
		}
	`).then(({ data }) => {
		data.tags.group.forEach(tag => {
			createPage({
				path: tag.name,
				component: tagTemplate,
				context: {
					tag: tag.name,
				},
			})
		})
	})
}

createVideoPages = (graphql, createPage) => {
	const articleTemplate = path.resolve(`./src/templates/video.js`)

	return graphql(`
		{
			videos: allVideo {
				nodes {
					slug
				}
			}
		}
	`).then(({ data }) => {
		data.videos.nodes.forEach(video => {
			createPage({
				path: video.slug,
				component: articleTemplate,
				context: {
					slug: video.slug,
				},
			})
		})
	})
}
