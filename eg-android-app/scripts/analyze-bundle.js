#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

/**
 * Bundle Analysis Script
 *
 * This script helps analyze the React Native bundle to identify:
 * - Large dependencies
 * - Unused code
 * - Optimization opportunities
 */

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUNDLE_OUTPUT = path.join(PROJECT_ROOT, 'bundle-analysis');

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
  }
}

function generateBundle(platform = 'android') {
  console.log(`🔄 Generating ${platform} bundle for analysis...`);

  const bundlePath = path.join(BUNDLE_OUTPUT, `${platform}-bundle.js`);
  const sourcemapPath = path.join(BUNDLE_OUTPUT, `${platform}-bundle.js.map`);

  try {
    execSync(
      [
        'npx react-native bundle',
        `--platform ${platform}`,
        `--bundle-output ${bundlePath}`,
        `--sourcemap-output ${sourcemapPath}`,
        '--dev false',
        '--minify true',
        '--reset-cache',
      ].join(' '),
      {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      },
    );

    console.log(`✅ Bundle generated: ${bundlePath}`);
    return {bundlePath, sourcemapPath};
  } catch (error) {
    console.error('❌ Failed to generate bundle:', error.message);
    process.exit(1);
  }
}

function analyzeBundleSize(bundlePath) {
  console.log('📊 Analyzing bundle size...');

  const stats = fs.statSync(bundlePath);
  const sizeInBytes = stats.size;
  const sizeInKB = Math.round(sizeInBytes / 1024);
  const sizeInMB = Math.round((sizeInBytes / (1024 * 1024)) * 100) / 100;

  console.log('📦 Bundle Size Analysis:');
  console.log(`   Raw size: ${sizeInBytes.toLocaleString()} bytes`);
  console.log(`   Size: ${sizeInKB.toLocaleString()} KB`);
  console.log(`   Size: ${sizeInMB} MB`);

  // Size recommendations
  if (sizeInMB > 10) {
    console.log('⚠️  Bundle is quite large (>10MB). Consider code splitting.');
  } else if (sizeInMB > 5) {
    console.log('⚠️  Bundle is moderately large (>5MB). Monitor for growth.');
  } else {
    console.log('✅ Bundle size looks good (<5MB).');
  }

  return {sizeInBytes, sizeInKB, sizeInMB};
}

function analyzeSourceMap(sourcemapPath) {
  console.log('🗺️  Analyzing source map...');

  try {
    const sourcemap = JSON.parse(fs.readFileSync(sourcemapPath, 'utf8'));
    const sourceFiles = sourcemap.sources || [];

    console.log('📁 Source Files Analysis:');
    console.log(`   Total source files: ${sourceFiles.length}`);

    // Categorize source files
    const categories = {
      node_modules: sourceFiles.filter(f => f.includes('node_modules')),
      src: sourceFiles.filter(f => f.includes('/src/')),
      native: sourceFiles.filter(f => f.includes('react-native')),
      other: sourceFiles.filter(
        f =>
          !f.includes('node_modules') &&
          !f.includes('/src/') &&
          !f.includes('react-native'),
      ),
    };

    Object.entries(categories).forEach(([category, files]) => {
      console.log(`   ${category}: ${files.length} files`);
    });

    // Find largest dependencies
    const dependencyMap = new Map();
    categories.node_modules.forEach(file => {
      const match = file.match(/node_modules\/([^\/]+)/);
      if (match) {
        const pkg = match[1];
        dependencyMap.set(pkg, (dependencyMap.get(pkg) || 0) + 1);
      }
    });

    const topDependencies = Array.from(dependencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\n📦 Top Dependencies by File Count:');
    topDependencies.forEach(([pkg, count], index) => {
      console.log(`   ${index + 1}. ${pkg}: ${count} files`);
    });

    return {categories, topDependencies};
  } catch (error) {
    console.error('❌ Failed to analyze source map:', error.message);
    return null;
  }
}

function generateRecommendations(analysis) {
  console.log('\n💡 Optimization Recommendations:');

  const recommendations = [];

  // Size-based recommendations
  if (analysis.size.sizeInMB > 5) {
    recommendations.push(
      'Consider implementing code splitting with React.lazy()',
    );
    recommendations.push('Review and remove unused dependencies');
    recommendations.push('Enable bundle splitting for common chunks');
  }

  // Dependency-based recommendations
  if (analysis.sourcemap) {
    const {topDependencies} = analysis.sourcemap;

    // Check for common optimization opportunities
    const heavyDeps = topDependencies.filter(([pkg, count]) => count > 20);
    if (heavyDeps.length > 0) {
      recommendations.push(
        `Consider optimizing heavy dependencies: ${heavyDeps
          .map(([pkg]) => pkg)
          .join(', ')}`,
      );
    }

    // Check for duplicate functionality
    const duplicateChecks = [
      {
        packages: ['lodash', 'underscore', 'ramda'],
        suggestion: 'Consider using a single utility library',
      },
      {
        packages: ['moment', 'date-fns', 'dayjs'],
        suggestion: 'Consider using a single date library',
      },
      {
        packages: ['axios', 'fetch'],
        suggestion: 'Consider standardizing on one HTTP client',
      },
    ];

    duplicateChecks.forEach(({packages, suggestion}) => {
      const found = packages.filter(pkg =>
        topDependencies.some(([depPkg]) => depPkg.includes(pkg)),
      );
      if (found.length > 1) {
        recommendations.push(`${suggestion} (found: ${found.join(', ')})`);
      }
    });
  }

  // General recommendations
  recommendations.push('Enable Hermes engine for better startup performance');
  recommendations.push('Use ProGuard/R8 for Android to reduce APK size');
  recommendations.push(
    'Consider using vector drawables instead of multiple PNG densities',
  );

  if (recommendations.length === 0) {
    console.log('   ✅ No immediate optimization opportunities found');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  return recommendations;
}

function generateReport(analysis, platform) {
  const reportPath = path.join(
    BUNDLE_OUTPUT,
    `${platform}-analysis-report.json`,
  );

  const report = {
    timestamp: new Date().toISOString(),
    platform,
    analysis,
    recommendations: generateRecommendations(analysis),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportPath}`);

  return reportPath;
}

function main() {
  console.log('🚀 Starting bundle analysis...\n');

  const platform = process.argv[2] || 'android';

  ensureDirectoryExists(BUNDLE_OUTPUT);

  // Generate bundle
  const {bundlePath, sourcemapPath} = generateBundle(platform);

  // Analyze bundle
  const sizeAnalysis = analyzeBundleSize(bundlePath);
  const sourcemapAnalysis = analyzeSourceMap(sourcemapPath);

  const analysis = {
    size: sizeAnalysis,
    sourcemap: sourcemapAnalysis,
  };

  // Generate recommendations and report
  generateReport(analysis, platform);

  console.log('\n✅ Bundle analysis complete!');
  console.log(`\n📊 Summary for ${platform}:`);
  console.log(`   Bundle size: ${sizeAnalysis.sizeInMB} MB`);
  console.log(
    `   Source files: ${
      sourcemapAnalysis?.categories
        ? Object.values(sourcemapAnalysis.categories).reduce(
            (sum, files) => sum + files.length,
            0,
          )
        : 'N/A'
    }`,
  );
  console.log(
    `   Top dependency: ${
      sourcemapAnalysis?.topDependencies?.[0]?.[0] || 'N/A'
    }`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  generateBundle,
  analyzeBundleSize,
  analyzeSourceMap,
  generateRecommendations,
};
