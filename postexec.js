/*
 * Copyright 2015 Alexander Pustovalov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var path = require('path');
var currentDir = process.cwd();
if (currentDir) {
	currentDir = currentDir.replace(/\\/g, '/');
}
var downloadController = require(currentDir + '/server/download/controller.js');
var pathParts = currentDir.split('/');

var inquirer = require('inquirer');

var PACKAGE_NAME = 'structor';
var NODE_DIR_NAME = 'node_modules';
var META_REPO_NAME = 'structor-meta';
var META_REPO_ARCHIVE_EXT = '.tar.gz';
var META_REPO_URL = 'https://github.com/ipselon/' + META_REPO_NAME;
var META_REPO_ARCHIVE_URL = META_REPO_URL + '/archive';

var questions = [
	{
		name: 'srcPath',
		message: 'Specify a directory name where the source code of the generated components will be.\n ' +
		'If the directory does not exist in the current project structure it will be created.\n',
		default: 'app',
		validate: (input) => /^\w+$/i.test(input) ? true : 'Alphanumeric value is acceptable only.'
	}
];

if (process.env.npm_config_global) {
	console.error('Structor must be installed locally.');
} else {
	if (pathParts && pathParts.length > 0) {
		var lastDir = pathParts[pathParts.length - 1];
		var nodeDir = pathParts[pathParts.length - 2];
		if (lastDir === PACKAGE_NAME && nodeDir === NODE_DIR_NAME) {

			const packageVersion = process.env.npm_package_version;
			const packageFileName = packageVersion + META_REPO_ARCHIVE_EXT;
			const packageInnerFolder = META_REPO_NAME + '-' + packageVersion;

			const appDirPath = path.resolve(currentDir, '../..');

			downloadController.checkMetaFolder(appDirPath)
				.then(() => {
					downloadController.downloadMetaDistr(META_REPO_ARCHIVE_URL + '/' + packageFileName, appDirPath)
						.then(destDirPath => {
							const srcFolderPath = path.join(destDirPath, packageInnerFolder);
							return downloadController.updateMetaFolder(srcFolderPath, appDirPath)
								.then(() => {
									return downloadController.removeFile(destDirPath);
								});
						})
						.then(() => {
							console.log('Meta data folder is updated successfully.');
						})
						.catch(error => {
							console.error(error);
						});
				})
				.catch(error => {
					downloadController.downloadMetaDistr(META_REPO_ARCHIVE_URL + '/' + packageFileName, appDirPath)
						.then(destDirPath => {
							const srcFolderPath = path.join(destDirPath, packageInnerFolder);
							return inquirer.prompt(questions)
								.then(answers => {
									const options = {
										srcPath: answers.srcPath,
									};
									return downloadController.createMetaFolder(srcFolderPath, appDirPath, options)
										.then(() => {
											return downloadController.ensureFileStructure(appDirPath, options);
										});
								})
								.then(() => {
									console.log('Meta data folder is created successfully.');
								})
								.catch(error => {
									console.error(error);
								})
								.then(() => {
									return downloadController.removeFile(destDirPath);
								});
						})
						.catch(error => {
							console.error(error);
						});
				});
		} else {
			// Installation of some local module.
			// do nothing;
		}
	} else {
		console.error('Can not parse current dir path.');
	}
}
