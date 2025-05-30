/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import all from 'it-all'
import last from 'it-last'
import { isNode } from 'wherearewe'
import { globSource, unixfs, urlSource } from '../src/index.js'
import { urlByteSource } from '../src/utils/url-source.js'
import type { UnixFS } from '../src/index.js'
import type { Blockstore } from 'interface-blockstore'

describe('addAll', () => {
  let blockstore: Blockstore
  let fs: UnixFS

  beforeEach(async () => {
    blockstore = new MemoryBlockstore()

    fs = unixfs({ blockstore })
  })

  it('adds a stream of files', async () => {
    const output = await all(fs.addAll([{
      path: './foo.txt',
      content: Uint8Array.from([0, 1, 2, 3, 4])
    }, {
      path: './bar.txt',
      content: Uint8Array.from([5, 4, 3, 2, 1])
    }]))

    expect(output).to.have.lengthOf(2)
    // spellchecker:disable-next-line
    expect(output[0].cid.toString()).to.equal('bafkreiaixnpf23vkyecj5xqispjq5ubcwgsntnnurw2bjby7khe4wnjihu')
    // spellchecker:disable-next-line
    expect(output[1].cid.toString()).to.equal('bafkreidmuy2n45xj3cdknzprtzo2uvgm3hak6mzy5sllxty457agsftd34')
  })

  it('recursively adds a directory', async function () {
    if (!isNode) {
      return this.skip()
    }

    const res = await last(fs.addAll(globSource('./test/fixtures', 'files/**/*')))

    // spellchecker:disable-next-line
    expect(res?.cid.toString()).to.equal('bafybeievhllpjjjbyg53g74wcl5hckdccjjj7zgtexqcacjegoduegnkyu')
  })
})

describe('addBytes', () => {
  let blockstore: Blockstore
  let fs: UnixFS

  beforeEach(async () => {
    blockstore = new MemoryBlockstore()

    fs = unixfs({ blockstore })
  })

  it('adds bytes', async () => {
    const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3, 4]))

    // spellchecker:disable-next-line
    expect(cid.toString()).to.equal('bafkreiaixnpf23vkyecj5xqispjq5ubcwgsntnnurw2bjby7khe4wnjihu')
  })
})

describe('addByteStream', () => {
  let blockstore: Blockstore
  let fs: UnixFS

  beforeEach(async () => {
    blockstore = new MemoryBlockstore()

    fs = unixfs({ blockstore })
  })

  it('adds bytes', async () => {
    const cid = await fs.addByteStream([Uint8Array.from([0, 1, 2, 3, 4])])

    // spellchecker:disable-next-line
    expect(cid.toString()).to.equal('bafkreiaixnpf23vkyecj5xqispjq5ubcwgsntnnurw2bjby7khe4wnjihu')
  })
})

describe('addFile', () => {
  let blockstore: Blockstore
  let fs: UnixFS

  beforeEach(async () => {
    blockstore = new MemoryBlockstore()

    fs = unixfs({ blockstore })
  })

  it('adds a file', async () => {
    const cid = await fs.addFile({
      path: '/file.txt',
      content: Uint8Array.from([0, 1, 2, 3, 4])
    })

    expect(cid.toString()).to.equal('bafybeid5m2zdvy6yz2ozuzidsaxex53epmminr4dkynmxjhcnbpvglql74')
    await expect(fs.stat(cid)).to.eventually.have.property('type', 'directory')

    const contents = await all(fs.ls(cid))
    expect(contents).to.have.lengthOf(1)
    expect(contents).to.have.nested.property('[0].type', 'raw')
    expect(contents).to.have.nested.property('[0].name', 'file.txt')
    expect(contents).to.have.nested.property('[0].path', 'bafybeid5m2zdvy6yz2ozuzidsaxex53epmminr4dkynmxjhcnbpvglql74/file.txt')
  })

  it('adds a file from a URL', async () => {
    const cid = await fs.addByteStream(urlByteSource(new URL(`${process.env.ECHO_SERVER}/download?data=hello-world`)))

    expect(cid.toString()).to.equal('bafkreifpuj5ujvb3aku75ja5cphnylsac3h47b6f3p4zbzmtm2nkrtrinu')
    await expect(fs.stat(cid)).to.eventually.have.property('type', 'raw')

    const contents = await all(fs.ls(cid))
    expect(contents).to.have.lengthOf(1)
    expect(contents).to.have.nested.property('[0].type', 'raw')
    expect(contents).to.have.nested.property('[0].name', 'bafkreifpuj5ujvb3aku75ja5cphnylsac3h47b6f3p4zbzmtm2nkrtrinu')
    expect(contents).to.have.nested.property('[0].path', 'bafkreifpuj5ujvb3aku75ja5cphnylsac3h47b6f3p4zbzmtm2nkrtrinu')
  })

  it('adds a file from a URL and includes the path', async () => {
    const cid = await fs.addFile(urlSource(new URL(`${process.env.ECHO_SERVER}/download?data=hello-world`)))

    expect(cid.toString()).to.equal('bafybeieij4nwevti7uttnkvutw5samohrnqxpakitwnoagwl55vn5oltrm')
    await expect(fs.stat(cid)).to.eventually.have.property('type', 'directory')

    const contents = await all(fs.ls(cid))
    expect(contents).to.have.lengthOf(1)
    expect(contents).to.have.nested.property('[0].type', 'raw')
    expect(contents).to.have.nested.property('[0].name', 'download')
    expect(contents).to.have.nested.property('[0].path', 'bafybeieij4nwevti7uttnkvutw5samohrnqxpakitwnoagwl55vn5oltrm/download')
  })

  it('adds a file with a path', async () => {
    const cid = await fs.addFile({
      content: Uint8Array.from([0, 1, 2, 3, 4]),
      path: '/file.txt'
    })

    // spellchecker:disable-next-line
    expect(cid.toString()).to.equal('bafybeid5m2zdvy6yz2ozuzidsaxex53epmminr4dkynmxjhcnbpvglql74')

    await expect(fs.stat(cid)).to.eventually.have.property('type', 'directory')

    const contents = await all(fs.ls(cid))
    expect(contents).to.have.lengthOf(1)
    expect(contents).to.have.nested.property('[0].name', 'file.txt')
    expect(contents).to.have.nested.property('[0].path', 'bafybeid5m2zdvy6yz2ozuzidsaxex53epmminr4dkynmxjhcnbpvglql74/file.txt')
  })

  it('adds a file with a path wrapped with a directory', async () => {
    const cid = await fs.addFile({
      content: Uint8Array.from([0, 1, 2, 3, 4]),
      path: '/file.txt'
    })

    expect(cid.toString()).to.equal('bafybeid5m2zdvy6yz2ozuzidsaxex53epmminr4dkynmxjhcnbpvglql74')

    await expect(fs.stat(cid)).to.eventually.have.property('type', 'directory')

    const contents = await all(fs.ls(cid))
    expect(contents).to.have.lengthOf(1)
    expect(contents).to.have.nested.property('[0].name', 'file.txt')
    expect(contents).to.have.nested.property('[0].path', 'bafybeid5m2zdvy6yz2ozuzidsaxex53epmminr4dkynmxjhcnbpvglql74/file.txt')
  })

  it('requires content to add a file', async () => {
    // @ts-expect-error missing field
    await expect(fs.addFile({
      path: '/foo.txt'
    })).to.eventually.be.rejectedWith(/content is required/)
  })

  it('requires path to add a file', async () => {
    // @ts-expect-error missing field
    await expect(fs.addFile({
      content: Uint8Array.from([0, 1, 2, 3])
    })).to.eventually.be.rejectedWith(/path is required/)
  })
})

describe('addDirectory', () => {
  let blockstore: Blockstore
  let fs: UnixFS

  beforeEach(async () => {
    blockstore = new MemoryBlockstore()

    fs = unixfs({ blockstore })
  })

  it('adds an empty directory with cidv0', async () => {
    const cid = await fs.addDirectory({}, {
      cidVersion: 0
    })

    expect(cid.toString()).to.equal('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
  })

  it('adds an empty directory with no args', async () => {
    const cid = await fs.addDirectory()

    expect(cid.toString()).to.equal('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
  })

  it('adds an empty directory with metadata', async () => {
    const cid = await fs.addDirectory({
      mode: 0x123,
      mtime: {
        secs: 5n,
        nsecs: 5
      }
    })

    expect(cid.toString()).to.equal('bafybeifj2yuv5mnnbw57oceooov4rrphvs7grxhbien42g3orki2t6xgae')

    const stat = await fs.stat(cid)
    expect(stat.mode).to.equal(0x123)
    expect(stat.mtime).to.deep.equal({
      secs: 5n,
      nsecs: 5
    })
  })

  it('adds a directory with a path', async () => {
    const cid = await fs.addDirectory({
      path: 'dir'
    })

    expect(cid.toString()).to.equal('bafybeid7d2tgynb3lcfgiqdln5vo73dhzw57febadhgu4cqrhm5vltvnbe')

    const stat = await fs.stat(cid, {
      path: 'dir'
    })
    expect(stat.cid.toString()).to.equal('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
  })
})
